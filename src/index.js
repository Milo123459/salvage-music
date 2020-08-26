const { Client, Message } = require("discord.js");
const Shoukaku = require("shoukaku");
const cache = require("./Cache");
/**
 * @typedef SalvageNode
 * @type {Object}
 * @property {String} auth The authorization (password)
 * @property {String} host The host, typically localhost
 * @property {Number} port The port of the node
 * @property {String} name The name of the node
 */
/**
 * @typedef SalvageMessages
 * @type {Object}
 * @property {Function} newSong The message to send when a new song is playing
 * @property {Function} destroy The message to send when a player is destroyed
 */
class SalvageMusic {
  /**
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
      isPlaylist
    };
  }
  checkURL(string) {
    try {
      new URL(string);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   *
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
   */
  async skip(message) {
    if(!this.getQueue(message)) return false;
    await this.queue.get(message.guild.id).player.stopTrack();
  }
  /**
   * @param {Message} message The message instance
   * @param {Number} amount The amount to set the volume to
   */
  async setVolume(message, amount) {
    if(!this.getQueue(message)) return false;
    await this.queue.get(message.guild.id).player.setVolume(amount);
  }
  /**
   * @param {Message} message The message instance
   */
  async pause(message) {
    if(!this.getQueue(message)) return false;
    this.queue.get(message.guild.id).player.setPaused(true);
  }
  /**
   * @param {Message} message The message instance
   */
  async resume(message) {
    if(!this.getQueue(message)) return false;
    this.queue.get(message.guild.id).player.setPaused(false);
  }
  /**
   * @param {Message} message
   */
  async stop(message) {
    if(!this.getQueue(message)) return false;
    await this.queue.get(message.guild.id).player.disconnect();
    this.queue.delete(message.guild.id);
  }
};
module.exports = SalvageMusic;