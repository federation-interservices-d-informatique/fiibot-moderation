import { fiiClient } from "@federation-interservices-d-informatique/fiibot-common";
import { GuildMember, Message } from "discord.js";
import { getDirname } from "./utils/getdirname.js";
import { Tedis } from "tedis";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const client = new fiiClient(
    {
        intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES"]
    },
    {
        commandManagerSettings: {
            commandsPath: [`${getDirname(import.meta.url)}/commands`]
        },
        owners: [743851266635071710],
        token: process.env.BOT_TOKEN
    }
);

const tedisClient = new Tedis({
    port: parseInt(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST
});
tedisClient.on("error", client.logger.error);

client.eventManager.registerEvent(
    "checkraidmode",
    "guildMemberAdd",
    async (member: GuildMember) => {
        if (member.user.bot) return;
        if (
            client.commandManager.commands.get("raidmode").data.get("raidmode")
        ) {
            if (
                (
                    client.commandManager.commands
                        .get("allow")
                        .data.get("allowedUsers") as string[]
                ).includes(member.user.id)
            )
                return;
            try {
                await member.user.send({
                    embeds: [
                        {
                            title: `Vous avez été expulsé(e) de ${member.guild.name}`,
                            description:
                                "Le serveur se trouve actuellement en mode raid, merci de réessayer plus tard.",
                            color: "RED"
                        }
                    ]
                });
            } catch (e) {
                client.logger.error(
                    `Unable to DM ${member.user.username}`,
                    "RAIDMODE"
                );
            }
            try {
                await member.kick("RAIDMODE");
            } catch (e) {
                client.logger.error(
                    `Can't kick ${member.user.username}`,
                    "RAIDMODE"
                );
            }
        }
    }
);

client.eventManager.registerEvent(
    "antispam",
    "messageCreate",
    async (msg: Message) => {
        if (msg.partial) await msg.fetch();
        /** Skip DMs and bots*/
        if (!msg.guild || msg.author.bot) return;
        if (
            msg.member.permissions.has("BAN_MEMBERS") ||
            client.isOwner(msg.author)
        )
            return;

        await tedisClient.lpush(
            msg.author.id,
            `${msg.createdTimestamp}^${msg.id}`
        );
        const messages = await tedisClient.lrange(
            msg.author.id,
            0,
            (await tedisClient.llen(msg.author.id)) - 1
        );
        if (messages.length > 7) {
            const spam = messages.filter((m) => {
                const stamp = m.split("^")[0] as unknown as number;
                if (stamp > msg.createdTimestamp - 7000) {
                    return m.split("^")[1];
                }
            });
            if (spam.length >= 7) {
                spam.forEach(async (m) => {
                    try {
                        const message = await msg.channel.messages.fetch(
                            m.split("^")[1]
                        );
                        if (message.deletable) await message.delete();
                    } catch (e) {
                        client.logger.error(
                            `Can't delete spam messages in ${msg.guild.name}`
                        );
                    }
                });
                try {
                    await msg.author.send({
                        embeds: [
                            {
                                title: `Expulsion de ${msg.guild.name}`,
                                color: "RED",
                                description: `Vous avez été expulsé(e) de ${msg.guild.name} pour Spam.`
                            }
                        ]
                    });
                } catch (e) {
                    client.logger.error(
                        `Can't dm ${msg.author.username}`,
                        "ANTISPAM"
                    );
                }
                if (msg.member.kickable) msg.member.kick("Spam");
                msg.channel.send(
                    `${msg.author.tag} (${msg.author.id}) a été expulsé(e) pour Spam`
                );
                tedisClient.del(msg.author.id);
            } else {
                if (
                    messages.length > 15 &&
                    (messages[0].split("^")[0] as unknown as number) >
                        msg.createdTimestamp - 60 * 1000
                ) {
                    tedisClient.del(msg.author.id);
                }
            }
        }
        console.log(await tedisClient.llen(msg.author.id));
    }
);
