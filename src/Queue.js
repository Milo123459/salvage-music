const Dispatch = require("./Dispatch");
const { ShoukakuSocket } = require("shoukaku");
class Queue extends Map {
  constructor(client, thisArg) {
    super();
    this.client = client;
    this.thisArg = thisArg;
  }
  /**
   *
   * @param {ShoukakuSocket} node
   * @param {*} track
   * @param {*} msg
   */
  async handle(node, track, msg) {
    const existing = this.get(msg.guild.id);
    if (!existing) {
      const player = await node.joinVoiceChannel({
        guildID: msg.guild.id,
        voiceChannelID: msg.member.voice.channelID,
      });
      const dispatcher = new Dispatch({
        client: this.client,
        guild: msg.guild,
        text: msg.channel,
        player,
        thisArg: this.thisArg,
      });
      dispatcher.queue.push(track);
      this.set(msg.guild.id, dispatcher);
      return dispatcher;
    }
    existing.queue.push(track);
    return null;
  }
}
module.exports = Queue;
