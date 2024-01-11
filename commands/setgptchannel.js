const {SlashCommandBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder} = require("discord.js")
const db = require("../db.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setgptchannel")
    .setDescription("Sets the channel the bot is active in.")
    .addChannelOption(option => option
      .setName("channel")
      .setDescription("Channel")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel")
    const message = await channel.send({
      content: "",
      components: [new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("newchat")
          .setLabel("New Chat")
          .setStyle(ButtonStyle.Primary)
      )]
    })
    await db.set(`startchatmessage.${interaction.guild.id}`, message.id)
    db.set(`gptchannel.${interaction.guildId}`, channel.id).then(async () => {
      interaction.reply(`Successfully set ChatGPT channel to <#${channel.id}>`)
    }).catch(console.error)
  }
}