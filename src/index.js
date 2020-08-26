const { Client, Message } = require("discord.js");
const Shoukaku = require("shoukaku");
const cache = require("./Cache");
/**
 * @description A node for connecting to lavalink
 * @typedef SalvageNode
 * @type {Object}
 * @property {String} auth The authorization (password)
 * @property {String} host The host, typically localhost
 * @property {Number} port The port of the node
 * @property {String} name The name of the node
 */
/**
 * @description An object containing important messages for a music bot.
 * @typedef SalvageMessages
 * @type {Object}
 * @property {Function} newSong The message to send when a new song is playing
 * @property {Function} destroy The message to send when a player is destroyed
 */
class SalvageMusic {
  /**
   * @description The main constructor / class for salvage-music
   * @param {Client} client Your discord bot client
   * @param {Array<SalvageNode>} nodes Your lavalink nodes
   * @param {SalvageMessages} messages The messages for your bot
   */
  constructor(client, nodes, messages) {
    cache.set(`newSong`, messages.newSong);
    cache.set(`destroy`, messages.destroy);
    this.shoukaku = new Shoukaku.Shoukaku(client, nodes, {
      moveOnDisconnect: true,
      reconnectTries: 3,
      restTimeout: 10000,
    });
    this.queue = new (require("./Queue"))(client, this);
  }
  /**
   *
   * @param {Shoukaku.ShoukakuSocket} node The node
   * @param {String} query The query
   * @param {'youtube'|'soundcloud'} service The service, either youtube or soundcloud
   * @param {Message} message A message instance
   * @description This will search and play a song if it finds one, it accepts a url and a query. If it works, it'll return an object containing data on what was played, if it was a playlist etc.
   */
  async searchAndPlay(node, query, service, message) {
    const searched = await node.rest.resolve(
      query,
      this.checkURL(query) ? null : service
    );
    if (!searched) return false;
    const { tracks, type, playlistName } = searched;
    const indexTrack = tracks.shift();
    const isPlaylist = type === "PLAYLIST";
    if (indexTrack.info.isStream) return false;
    const res = await this.queue.handle(node, indexTrack, message);
    if (isPlaylist) {
      for (const track of tracks) await this.queue.handle(node, track, message);
    }
    if (res) await res.play();
    return {
      songInfo: indexTrack.info,
      playlistName,
      tracks,
      isPlaylist,
    };
  }
  /**
   * @description Will return true if it is a valid url, false if it isn't. This is a utility, recommended you don't use it.
   * @param {String} string A string to test
   * @private
   */
  checkURL(string) {
    try {
      new URL(string);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * @description Will get the current playing song and the queue for the guild if it exists, if it doesn't it will return false.
   * @param {Message} message The message instance
   */
  getQueue(message) {
    return this.queue.has(message.guild.id)
      ? {
          nowPlaying: this.queue.get(message.guild.id).current.info,
          queue: this.queue.get(message.guild.id).queue,
        }
      : false;
  }
  /**
   * @param {Message} message The message instance
   * @description Will return true if success, false if failed. Will skip the current playing song
   */
  async skip(message) {
    if (!this.getQueue(message)) return false;
    await this.queue.get(message.guild.id).player.stopTrack();
    return true;
  }
  /**
   * @param {Message} message The message instance
   * @param {Number} amount The amount to set the volume to
   * @description Will return true if success, false if failed. Will set the volume of the bot in a guild.
   */
  async setVolume(message, amount) {
    if (!this.getQueue(message)) return false;
    await this.queue.get(message.guild.id).player.setVolume(amount);
    return true;
  }
  /**
   * @param {Message} message The message instance
   * @description Will return true if success, false if failed. Will make the bot pause the music if it is currently playing.
   */
  async pause(message) {
    if (!this.getQueue(message)) return false;
    if (this.queue.get(message.guild.id).player.paused == true) return false;
    this.queue.get(message.guild.id).player.setPaused(true);
  }
  /**
   * @param {Message} message The message instance
   * @description Will return true if success, false if failed. Will make the bot resume the music if it is currently paused.
   */
  async resume(message) {
    if (!this.getQueue(message)) return false;
    if (this.queue.get(message.guild.id).player.paused == false) return false;
    this.queue.get(message.guild.id).player.setPaused(false);
    return true;
  }
  /**
   * @param {Message} message The message instance
   * @description Will return true if success, false if failed. Will make the bot leave the voice channel and delete the queue for that guild.
   */
  async stop(message) {
    if (!this.getQueue(message)) return false;
    await this.queue.get(message.guild.id).player.disconnect();
    this.queue.delete(message.guild.id);
    return true;
  }
}
module.exports = SalvageMusic;
