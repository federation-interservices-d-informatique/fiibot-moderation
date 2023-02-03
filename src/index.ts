import {
    FiiClient,
    getDirname,
    SERVERS_LIST
} from "@federation-interservices-d-informatique/fiibot-common";
import {
    ActivityType,
    ChannelType,
    Colors,
    GatewayIntentBits,
    GuildMember,
    Message
} from "discord.js";
import { Tedis } from "tedis";
import { INVITATION_REGEX } from "./utils/constants.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const client = new FiiClient(
    {
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    },
    {
        managersSettings: {
            interactionsManagerSettings: {
                interactionsPaths: [`${getDirname(import.meta.url)}/commands`]
            },
            eventsManagerSettings: {
                eventsPaths: []
            }
        },
        token: process.env.BOT_TOKEN ?? ""
    },
    {
        dbConfig: {
            host: process.env.DB_HOST,
            database: process.env.POSTGRES_DB,
            password: process.env.POSTGRES_PASSWORD,
            user: process.env.POSTGRES_USER
        },
        tableName: "fiibotmoderation"
    }
);

const tedisClient = new Tedis({
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    host: process.env.REDIS_HOST
});

tedisClient.on("error", client.logger.error);

client.on("ready", async () => {
    await client.user?.setActivity({
        name: "La FII",
        type: ActivityType.Watching
    });
});

client.eventManager.registerEvent(
    "checkraidmode",
    "guildMemberAdd",
    async (member: GuildMember) => {
        if (member.user.bot) return;
        if (
            client.interactionManager?.interactions
                .get("raidmode")
                ?.data.get("raidmode")
        ) {
            if (client.isOwner(member.user)) return;
            if (
                (
                    (client.interactionManager?.interactions
                        .get("raidmode")
                        ?.data.get("allowedUsers") as string[]) || []
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
                            color: Colors.Red
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
            msg.member?.permissions.has("BanMembers") ||
            client.isOwner(msg.author)
        )
            return;

        const allowedChans =
            (await client.dbClient?.get<Array<string>>(
                `${msg.guildId}-allowedchannels`
            )) || [];

        if (allowedChans.includes(msg.channelId)) return;

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
                            `Can't delete spam messages in ${msg.guild?.name}`
                        );
                    }
                });
                try {
                    client.logger.info(
                        `Kicking ${msg.author.username} (${msg.author.id}) in ${msg.guild.name}`,
                        "ANTISPAM"
                    );
                    await msg.author.send({
                        embeds: [
                            {
                                title: `Expulsion de ${msg.guild.name}`,
                                color: Colors.Red,
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
                if (msg.member?.kickable) msg.member.kick("Spam");
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
    }
);

client.eventManager.registerEvent(
    "processInvites",
    "messageCreate",
    async (msg: Message) => {
        if (msg.author.bot || !msg.member) return;
        if (
            client.isOwner(msg.author) ||
            msg.member.permissions.has("Administrator")
        )
            return;
        if (INVITATION_REGEX.test(msg.content)) {
            const invitationLink = msg.content.match(INVITATION_REGEX);
            if (!invitationLink) return;
            if (invitationLink.length >= 5 && msg.deletable)
                return await msg.delete();
            invitationLink.every(async (link) => {
                const splitted = link.split("/");
                const inviteCode = splitted[splitted.length - 1];
                try {
                    const data = await client.fetchInvite(inviteCode);
                    if (!data)
                        return client.logger.warn(
                            `Detected invalid invite ${inviteCode}`,
                            "PROCESSINVITES"
                        );

                    if (!data.guild) return await msg.delete();
                    if (!SERVERS_LIST.includes(data.guild.id)) {
                        let content = msg.content.replace(
                            inviteCode,
                            "{Invitation censurée}"
                        );
                        content = content.replace(
                            /@(here|everyone)/gim,
                            "`MENTION INTERDITE`"
                        );
                        content = content.replace(
                            /<@&[0-9]{18}>/gim,
                            "`Mention de rôle`"
                        );
                        if (msg.deletable) await msg.delete();
                        if (msg.channel.type === ChannelType.GuildText) {
                            const hooks = await msg.channel.fetchWebhooks();
                            let hook = hooks
                                .filter((h) => h.name === "FIIBOT")
                                .first();
                            if (!hook) {
                                hook = await msg.channel.createWebhook({
                                    name: "FIIBOT"
                                });
                            }
                            hook.send({
                                content,
                                username: msg.author.username,
                                avatarURL: msg.author.displayAvatarURL()
                            });
                            return false;
                        } else if (
                            msg.channel.type ===
                                ChannelType.GuildPrivateThread ||
                            msg.channel.type === ChannelType.GuildPublicThread
                        ) {
                            msg.channel.send(`DE ${msg.author}: ${content}`);
                            return false;
                        }
                    }
                } catch (e) {
                    client.logger.error(
                        `Error when fetching ${link}: ${e}`,
                        "processInvites"
                    );
                }
            });
        }
    }
);
