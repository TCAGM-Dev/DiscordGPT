const {SlashCommandBuilder} = require("discord.js")
const db = require("../db.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setsystemmessage")
    .setDescription("Sets the system message of the current conversation")
    .addStringOption(option => option
      .setName("systemmessage")
      .setDescription("System message")
      .setRequired(true)
    )
    .setDMPermission(false),
  async execute(interaction) {
    if (!interaction.channel.isThread()) {interaction.reply("Could not set system message of non-thread channel"); return}
    db.get(`gptchannel.${interaction.guild.id}`).then(async channelid => {
      if (interaction.channel.parent.id != channelid) {interaction.reply("Could not set system message of non-conversation channel"); return}
      const systemmessage = interaction.options.get("systemmessage").value
      db.set(`systemmessage.${interaction.channel.id}`, systemmessage).then(async () => {
        await interaction.reply(`Successfully set system message of this conversation to \`${systemmessage}\``)
      }).catch(console.error)
    })
  }
}