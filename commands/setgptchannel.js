const {SlashCommandBuilder, ChannelType, PermissionFlagsBits} = require("discord.js")
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
    const channelid = interaction.options.get("channel").value
    db.set(`gptchannel.${interaction.guildId}`, channelid).then(() => {
      interaction.reply(`Successfully set ChatGPT channel to <#${channelid}>`)
    }).catch(console.error)
  }
}