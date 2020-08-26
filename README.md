# Hey there 👋

**Have you ever wanted to create a discord music bot? If so, this is the right package for you!**

**Features:**

- Lightweight 🚀
- Fast ▶️
- Feature-rich ☕
- Queue system built in 📶
- Uses LavaLink 🔥
- Easy to use 🐭
- Maintained 😄

**Credits 😮**

Uses [Shoukaku](https://npm.im/shoukaku)

Queue system has been taken and modified from the open source demo bot for shoukaku

Wrapper coded by [salvage_dev](https://youtube.com/SalvageDev)

**Examples ⌨️**

```js
const Salvage = require("salvage-music");
const Discord = require("discord.js");
const client = new Discord.Client();
const Music = new Salvage(
  client,
  [
    {
      name: `node1`,
      auth: `youshallnotpass`,
      host: `localhost`,
      port: 6930,
    },
  ],
  {
    newSong: (song) => `Now playing: ${song.title} by ${song.author}`,
    destroy: () => `I left.`,
  }
); // The nodes have to be lavalink servers.
client.on("message", async (message) => {
  if (message.author.bot || !message.guild) return;
  const [cmd, ...args] = message.content.trim().split(/ +/g);
  switch (cmd.toLowerCase()) {
    case "play":
      if (!args.join(" ")) return;
      const Node = Music.shoukaku.getNode();
      const Result = await Music.searchAndPlay(
        Node,
        args.join(" "),
        `youtube`,
        message
      );
      if (!Result) return;
      message.channel.send(
        Result.isPlaylist
          ? `Loaded ${Result.playlistName} playlist which has ${Result.tracks.length} songs`
          : `Loaded ${Result.songInfo.title} by ${Result.songInfo.author}`
      );
      break;
  }
});
client.login(`my token`);
// A simple play command
```

**There is so much more you can do with this module, keep on reading!**

Hold up, want some nicely formatted documentation? Thought so - click [here](https://milo123459.github.io/salvage-music/)
