const {SlashCommandBuilder} = require("discord.js")
const db = require("../db.js")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Sends a single message to ChatGPT")
    .addStringOption(option => option
      .setName("prompt")
      .setDescription("Message")
      .setRequired(true)
    ),
  async execute(interaction, sendGPTMessage) {
    const prompt = interaction.options.get("prompt").value
    await interaction.deferReply({
      ephemeral: true
    })
    let replycontent = ""
    const response = await sendGPTMessage(interaction.user, {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are ChatGPT, a large language model trained by OpenAI. You answer as concisely as possible for each response. If you are generating a list, do not have too many items."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
    console.log(response)
    interaction.editReply("yes")
  }
}