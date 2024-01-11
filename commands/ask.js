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
    const res = await sendGPTMessage(interaction.user, prompt, {onProgress: async res => {
      if (res.text.length <= 0 || replycontent == res.text || replycontent.length < res.text.length) return;
      interaction.editReply((res.text + "_").slice(0, 2000))
      replycontent = (res.text + "_").slice(0, 2000)
    }})
    interaction.editReply(res.text.slice(0, 2000))
  }
}