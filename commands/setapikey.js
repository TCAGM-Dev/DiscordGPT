const {SlashCommandBuilder} = require("discord.js")
const db = require("../db.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setapikey")
    .setDescription("Sets your personal API key.")
    .addStringOption(option => option
      .setName("apikey")
      .setDescription("API key")
    )
    .setDMPermission(false),
  async execute(interaction) {
    const apikey = interaction.options.getString("apikey")
    if (apikey) {
      db.set(`apikey.${interaction.user.id}`, apikey).then(() => {
        interaction.reply({
          content: `Successfully set your personal API key to \`${apikey}\``,
          ephemeral: true
        })
      }).catch(console.error)
    } else {
      db.delete(`apikey.${interaction.user.id}`).then(() => {
        interaction.reply({
          content: `Successfully cleared your personal API key`,
          ephemeral: true
        })
      }).catch(console.error)
    }
  }
}