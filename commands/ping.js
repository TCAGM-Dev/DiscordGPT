const {SlashCommandBuilder} = require("discord.js")
const db = require("../db.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Give the current bot two-way ping"),
  async execute(interaction, sendGPTMessage) {
    const reply = await interaction.reply({
      content: "Pinging...",
      fetchReply: true
    })
    await interaction.editReply(`Pong! Took ${reply.createdTimestamp - interaction.createdTimestamp}ms`)
  }
}