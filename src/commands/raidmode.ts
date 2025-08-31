import {
    ActivityType,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    Colors,
    WebhookClient
} from "discord.js";
import {
    FiiClient,
    BotInteraction
} from "@federation-interservices-d-informatique/fiibot-common";
export default class PingCommand extends BotInteraction {
    constructor(client: FiiClient) {
        super(
            client,
            {
                name: "raidmode",
                description: "Gérer le raidmode",
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "enable",
                        description: "Activer le raidmode"
                    },
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: "disable",
                        description: "Désactiver le raimode"
                    },
                    {
                        type: ApplicationCommandOptionType.SubcommandGroup,
                        name: "user",
                        description:
                            "Autoriser/interdir à un utilisateur de passer à travers le raidmode",
                        options: [
                            {
                                type: ApplicationCommandOptionType.Subcommand,
                                name: "allow",
                                description:
                                    "Autoriser un utilisateur à passer à travers le raidmode",
                                options: [
                                    {
                                        type: ApplicationCommandOptionType.String,
                                        name: "user",
                                        description: "L'utilisateur",
                                        required: true
                                    }
                                ]
                            },
                            {
                                type: ApplicationCommandOptionType.Subcommand,
                                name: "deny",
                                description:
                                    "Interdir à un utilisateur de passer à travers le raidmode",
                                options: [
                                    {
                                        type: ApplicationCommandOptionType.String,
                                        name: "user",
                                        description: "L'utilisateur à interdir",
                                        required: true
                                    }
                                ]
                            },
                            {
                                type: ApplicationCommandOptionType.Subcommand,
                                name: "list",
                                description:
                                    "Lister les utilisateurs/trices qui ont la permission de passer à travers le raidmode"
                            }
                        ]
                    }
                ]
            },
            {
                ownerOnly: true
            }
        );
    }
    async runChatInputCommand(
        inter: ChatInputCommandInteraction
    ): Promise<void> {
        if (inter.options.getSubcommand() === "enable") {
            await inter.reply("Le raidmode a été activé!");
            this.data.set("raidmode", true);
            this.client.user?.setActivity({
                type: ActivityType.Playing,
                name: "protéger la FII"
            });
            try {
                const raidModeHook = new WebhookClient({
                    id: process.env.RAIDMODE_HOOK_ID ?? "",
                    token: process.env.RAIDMODE_HOOK_TOKEN ?? ""
                });

                await raidModeHook.send({
                    content: `Le raimode a été activé par ${inter.user.tag} (${inter.user.id}) sur ${inter.guildId ?? ""}`
                });
            } catch (e) {
                if (e instanceof Error)
                    this.client.logger.error(
                        `Can't sent raidmode logs: ${e}`,
                        "RAIMODE"
                    );
            }
        } else if (inter.options.getSubcommand() === "disable") {
            await inter.reply("Le raidmode a été désactivé");
            this.data.set("raidmode", false);
            this.client.user?.setActivity({
                type: ActivityType.Watching,
                name: "La FII"
            });
            try {
                const raidModeHook = new WebhookClient({
                    id: process.env.RAIDMODE_HOOK_ID ?? "",
                    token: process.env.RAIDMODE_HOOK_TOKEN ?? ""
                });

                await raidModeHook.send({
                    content: `Le raimode a été désactivé par ${inter.user.tag} (${inter.user.id}) sur ${inter.guildId ?? ""}`
                });
            } catch (e) {
                if (e instanceof Error)
                    this.client.logger.error(
                        `Can't sent raidmode logs: ${e}`,
                        "RAIMODE"
                    );
            }
        } else if (inter.options.getSubcommandGroup() === "user") {
            if (inter.options.getSubcommand() === "allow") {
                const user = inter.options.getString("user");
                if (!user) return;

                if (isNaN(user as unknown as number)) {
                    await inter.reply("Utilisateur invalide!");
                    return;
                }
                const allowed: string[] =
                    (this.data.get("allowedUsers") as string[] | undefined) ?? [];
                allowed.push(user);

                await inter.reply({
                    embeds: [
                        {
                            title: "Utilisateur/trice autorisé(e) !",
                            color: Colors.Green
                        }
                    ]
                });
                this.data.set("allowedUsers", allowed);
                try {
                    const raidmodeHook = new WebhookClient({
                        id: process.env.RAIDMODE_HOOK_ID ?? "",
                        token: process.env.RAIDMODE_HOOK_TOKEN ?? ""
                    });
                    await raidmodeHook.send({
                        embeds: [
                            {
                                description: `L'utilisateur/trice ${user} a été autorisé(e) à passer à travers le raidmode`,
                                color: Colors.Yellow
                            }
                        ]
                    });
                } catch (e) {
                    if (e instanceof Error)
                        this.client.logger.error(
                            `Can't send raidmode logs (ALLOWED USER ${user})`,
                            "RAIMODE"
                        );
                }
            } else if (inter.options.getSubcommand() === "deny") {
                const user = inter.options.getString("user");
                if (!user) return;

                if (isNaN(user as unknown as number)) {
                    await inter.reply("Utilisateur invalide!");
                    return;
                }
                let allowed: string[] =
                    (this.data.get("allowedUsers") as string[] | undefined) ?? [];
                allowed = allowed.filter((f) => f !== user);

                await inter.reply({
                    embeds: [
                        {
                            title: "Utilisateur/trice n'a plus l'autorisation de passer à travers le raidmode!",
                            color: Colors.Green
                        }
                    ]
                });
                this.data.set("allowedUsers", allowed);
                try {
                    const raidmodeHook = new WebhookClient({
                        id: process.env.RAIDMODE_HOOK_ID ?? "",
                        token: process.env.RAIDMODE_HOOK_TOKEN ?? ""
                    });
                    await raidmodeHook.send({
                        embeds: [
                            {
                                description: `L'utilisateur/trice ${user} n'a plus l'autorisation de passer à travers le raidmode`,
                                color: Colors.Yellow
                            }
                        ]
                    });
                } catch (e) {
                    if (e instanceof Error)
                        this.client.logger.error(
                            `Can't send raidmode logs (DENY USER ${user})`,
                            "RAIMODE"
                        );
                }
            } else {
                await inter.reply({
                    embeds: [
                        {
                            title: "Liste des personnes autorisées à passer à travers le raidmode",
                            description:
                                (
                                    (this.data.get(
                                        "allowedUsers"
                                    ) as string[] | undefined) ?? []
                                ).length > 0
                                    ? (
                                          this.data.get(
                                              "allowedUsers"
                                          ) as string[] | undefined ?? []
                                      ).join(",")
                                    : "Personne n'est autorisé à passer à travers le raidmode"
                        }
                    ]
                });
            }
        }
    }
}
