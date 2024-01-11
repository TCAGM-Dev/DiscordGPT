const {SlashCommandBuilder, AttachmentBuilder, EmbedBuilder} = require("discord.js")
const fs = require("fs")
const http = require("http")

const models = {
  pollinations: interaction => {
    const prompt = interaction.options.get("prompt").value
    
    const req = http.request({
      hostname: "image.pollinations.ai",
      port: 80,
      path: `/prompt/${encodeURIComponent(prompt)}`,
      method: "GET"
    }, res => {
      const stream = fs.createWriteStream("image.jpg")
      res.on("data", chunk => {
        stream.write(chunk)
      })
      res.on("end", async () => {
        stream.end()
        interaction.editReply({embeds: [new EmbedBuilder()
          .setTitle(prompt)
          .setImage("attachment://image.jpg")
        ], files: [
          new AttachmentBuilder("./image.jpg")
        ]})
        fs.rm("image.jpg", err => {if (err) console.error(err)})
      })
    })
    req.end()
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("image")
    .setDescription("Generates an image using AI")
    .addStringOption(option => option
      .setName("prompt")
      .setDescription("Image Prompt")
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName("model")
      .setDescription("The model/source to use")
      .setAutocomplete(true)
    ),
  async execute(interaction) {
    const modeloption = interaction.options.get("model") ?? {}
    const model = models[modeloption.value ?? Object.keys(models)[0]]
    await interaction.deferReply({ephemeral: true})
    model(interaction)
  },
  async autocomplete(interaction) {
    const value = interaction.options.getFocused().value
    interaction.respond(Object.keys(models).filter(v => v.startswith(value)).map(v => ({name: v, value: v})))
  }
}