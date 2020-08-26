const { MessageEmbed } = require("discord.js");
const cache = require("./Cache");
class VibezDispatcher {
  constructor(options) {
    this.client = options.client;
    this.guild = options.guild;
    this.text = options.text;
    this.player = options.player;
    this.queue = [];
    this.current = null;
    this.thisArg = options.thisArg;
    this.player.on("start", () =>
      this.text.send(cache.get(`newSong`)(this.current.info)).catch(() => null)
    );
    this.player.on("end", () => {
      this.play().catch((error) => {
        this.queue.length = 0;
        this.destroy();
      });
    });
  }

  get exists() {
    return this.thisArg.queue.has(this.guild.id);
  }

  async play() {
    if (!this.exists || !this.queue.length) return this.destroy();
    this.current = this.queue.shift();
    await this.player.playTrack(this.current.track);
  }

  destroy(reason) {
    if (reason) console.log(this.constructor.name, reason);
    this.queue.length = 0;
    this.player.disconnect();
    this.thisArg.queue.delete(this.guild.id);
    this.text.send(cache.get(`destroy`)()).catch(() => null);
  }
}
module.exports = VibezDispatcher;
