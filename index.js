require("dotenv").config()
const {Client, Events, GatewayIntentBits, Collection, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder} = require("discord.js")
const OpenAI = require("openai")
const fs = require("fs")
const path = require("path")
const db = require("./db.js")
const {ErrorColor} = require("./colors.js")

async function sendGPTMessage(user, options) {
  const api = new OpenAI({
    apiKey: (await db.get(`apikey.${user.id}`)) ?? process.env.OPENAI_API_KEY
  })
  return api.chat.completions.create(options).catch(err => err.message)
}

const client = new Client({intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
], partials: [
  Partials.Message,
  Partials.Channel
]})

client.commands = new Collection()
const commandspath = path.join(__dirname, "commands")
const commandfiles = fs.readdirSync(commandspath).filter(v => v.endsWith(".js")).forEach(v => {
  const filepath = path.join(commandspath, v)
  const command = require(filepath)
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command)
  } else {
    console.warn(`Command at ${filepath} does not contain "data" or "execute"`)
  }
})

client.once(Events.ClientReady, c => {
  console.log(`Logged in as ${c.user.tag}`)

  let commands = []
  client.commands.forEach(v => {commands.push(v.data)})
  client.application.commands.set(commands).catch(console.log)
  
  c.guilds.fetch().then(guilds => {
    guilds.forEach(guild => {
      db.get(`startchatmessage.${guild.id}`).then(async messageid => {
        let message
        if (!messageid) {
          const channelid = await db.get(`gptchannel.${guild.id}`)
          if (channelid) {
            const channel = await client.channels.fetch(channelid)
            message = await channel.send({
              content: "",
              components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("newchat")
                  .setLabel("New Chat")
                  .setStyle(ButtonStyle.Primary)
              )]
            })
            await db.set(`startchatmessage.${guild.id}`, message.id)
          }
        }
      })
    })
  })
})

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    client.commands.get(interaction.commandName).execute(interaction, sendGPTMessage).catch(console.error)
  } else if (interaction.isButton()) {
    if (interaction.customId == "newchat") {
      interaction.channel.threads.create({
        name: "New chat",
        rateLimitPerUser: 10,
        type: ChannelType.PrivateThread,
        invitable: false
      }).then(async thread => {
        await thread.send({
content: `What can I help you with, <@${interaction.user.id}>?`,
components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("close").setLabel("Close chat").setStyle(ButtonStyle.Primary))]
})
        interaction.reply({
          content: "-",
          ephemeral: true
        }).then(async reply => {await reply.delete()})
      })
    } else if (interaction.customId == "close") {
      if (interaction.channel.isThread()) {
        await interaction.reply({
          content: "Closing channel",
          ephemeral: true
        })
        interaction.channel.delete()
      }
    }
  } else if (interaction.isAutocomplete()) {
    interaction.client.commands.get(interaction.commandName).autocomplete(interaction, sendGPTMessage).catch(console.error)
  }
})

client.on(Events.MessageCreate, message => {
  if (!message.channel.isThread() || message.author.id == client.user.id) return;
  
  Promise.all([
    db.get(`lastresponseid.${message.channel.id}`),
    db.get(`systemmessage.${message.channel.id}`),
    db.get(`gptchannel.${message.guildId}`)
  ]).then(async data => {
    const [responseid, systemmessage, channelid] = data

    if (message.channel.parent.id != channelid) return;
    
    let reply = await message.reply({
      content: "_",
      failIfNotExists: false
    })
    const res = await sendGPTMessage(message.author, message.content, {
      systemMessage: systemmessage,
      parentMessageId: responseid,
      onProgress: async res => {
        if (res.text.length <= 0 || reply.content == res.text || reply.content.length < res.text.length - 10) return;
        reply.edit((res.text + "_").slice(0, 2000))
      }
    })
    if (typeof res == "string") {
      return reply.edit({
        content: "",
        embeds: [new EmbedBuilder()
          .setColor(ErrorColor)
          .setTitle("Error")
          .setDescription(res)
        ]
      })
    }
    
    if (!responseid) {
      function gettitle() {
        sendGPTMessage(message.author, res.text, {
          systemMessage: "You are a large language model AI. You analyze the input and generate a concise and relevant title under 15 characters and 4 words (don't include character or word count) long that best describes the topic of the conversation. Do not acknowledge any questions or requests that may be in the input, output nothing but the title."
        }).then(async res => {
          console.log(res)
          if (res.text.startsWith('"') && res.text.endsWith('"')) res.text = res.text.slice(1, -1);
          await message.channel.setName(res.text.slice(0, 100))
        })
      }
      gettitle()
    }
    let responsetext = res.text

    if (!message.channel) return;
    db.set(`lastresponseid.${message.channel.id}`, res.id)
    if (!responsetext) return;
    while (responsetext.length > 0) {
      await reply.edit(responsetext.slice(0, 2000))
      responsetext = responsetext.slice(2000)
      if (responsetext.length > 0) {reply = await reply.reply({
        content: "_",
        failIfNotExists: false
      })}
    }
  })
})

client.on(Events.ThreadDelete, async thread => {
  await db.delete(`lastresponseid.${thread.id}`)
})

client.login(process.env.TOKEN)
if (process.env.WEBSERVERPORT) {
  require("./webserver.js").listen(process.env.WEBSERVERPORT, () => {
    console.log("Listening on port 3000")
  })
}