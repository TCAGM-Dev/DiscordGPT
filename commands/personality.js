const {SlashCommandBuilder} = require("discord.js")
const db = require("../db.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("personality")
    .setDescription("Command for saving and loading personalities")
    .addSubcommand(subcommand => subcommand
      .setName("save")
      .setDescription("Save a personality")
      .addStringOption(option => option
        .setName("name")
        .setDescription("Personality name")
        .setRequired(true)
      )
      .addStringOption(option => option
        .setName("systemmessage")
        .setDescription("The system message corresponding to the personality")
        .setRequired(true)
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName("list")
      .setDescription("List all available personalities")
    )
    .addSubcommand(subcommand => subcommand
      .setName("get")
      .setDescription("Get the system message associated with a personality")
      .addStringOption(option => option
        .setName("personality")
        .setDescription("The personality")
        .setRequired(true)
      )
    )
    .addSubcommand(subcommand => subcommand
      .setName("load")
      .setDescription("Load a personality for use")
      .addStringOption(option => option
        .setName("personality")
        .setDescription("The personality")
        .setRequired(true)
        .setAutocomplete(true)
      )
    )
    .setDMPermission(false),
  async execute(interaction) {
    if (interaction.options.getSubcommand() == "save") {
      const name = interaction.options.get("name").value
      const systemmessage = interaction.options.get("systemmessage").value
      db.set(`personality.${name}`, systemmessage).then(() => {
        interaction.reply({
          content: `Successfully saved personality **${name}** as: \`${systemmessage}\``,
          ephemeral: true
        })
      }).catch(console.error)
    } else if (interaction.options.getSubcommand() == "list") {
      db.list("personality.").then(keys => {
        if (keys.length <= 0) keys.push("personality.None");
        interaction.reply({
          content: `Available personalities:\n${keys.map(v => `- **${v.slice(12)}**`).join("\n")}`,
          ephemeral: true
        })
      })
    } else if (interaction.options.getSubcommand() == "get") {
      const name = interaction.options.get("personality").value
      const message = await db.get(`personality.${name}`) ?? "None"
      interaction.reply({
        content: `The system message for personality **${name}** is \`${message}\``,
        ephemeral: true
      })
    } else if (interaction.options.getSubcommand() == "load") {
      if (!interaction.channel.isThread()) {interaction.reply("Could not load a personality in a non-thread channel."); return}
      const name = interaction.options.get("personality").value
      Promise.all([
        db.get(`gptchannel.${interaction.guild.id}`),
        db.get(`personality.${name}`)
      ]).then(data => {
        const [channelid, systemmessage] = data
        if (interaction.channel.parent.id != channelid) {interaction.reply("Could not load a personality in a non-conversation channel."); return}
        if (!systemmessage) {interaction.reply("Unknown personality"); return}
        db.set(`systemmessage.${interaction.channel.id}`, systemmessage).then(() => {
          interaction.reply(`Successfully set personality of this conversation to **${name}**: \`${systemmessage}\``)
        }).catch(console.error)
      }).catch(console.error)
    }
  },
  async autocomplete(interaction) {
    const options = (await db.list("personality.")).map(v => v.slice(12)).filter(v => v.toLowerCase().startsWith(value.toLowerCase()))
    interaction.respond(options.map(v => ({name: v, value: v})))
  }
}