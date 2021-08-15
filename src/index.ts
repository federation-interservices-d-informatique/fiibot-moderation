import { fiiClient } from "@federation-interservices-d-informatique/fiibot-common";
import { GuildMember } from "discord.js";
import { getDirname } from "./utils/getdirname.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const client = new fiiClient(
    {
        intents: ["GUILDS", "GUILD_MEMBERS"]
    },
    {
        commandManagerSettings: {
            commandsPath: [`${getDirname(import.meta.url)}/commands`]
        },
        owners: [743851266635071710],
        token: process.env.BOT_TOKEN
    }
);

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
                    `Unable to DM ${member.guild.name}`,
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
