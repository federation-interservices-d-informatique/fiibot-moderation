import { CommandInteraction } from "discord.js";
import {
    fiiClient,
    Command
} from "@federation-interservices-d-informatique/fiibot-common";
export default class PingCommand extends Command {
    constructor(client: fiiClient) {
        super(
            client,
            {
                name: "deny",
                description:
                    "Interdir à un utilisateur de passer à travers le raidmode",
                options: [
                    {
                        type: "STRING",
                        name: "utilisateur",
                        required: true,
                        description: "L'utilisateur à interdir"
                    }
                ]
            },
            { guildOnly: true }
        );
    }
    async run(inter: CommandInteraction): Promise<void> {
        const user = inter.options.get("utilisateur").value.toString();
        if (isNaN(user as unknown as number)) {
            inter.reply("Utilisateur invalide!");
            return;
        }
        let allowed: string[] =
            (this.data.get("allowedUsers") as string[]) || [];
        allowed = allowed.filter((f) => f !== user);

        inter.reply(
            `Utilisateur interdit\nListe des utilisateurs autorisés: ${allowed.join(
                ", "
            )}`
        );
        this.client.commandManager.commands
            .get("allow")
            .data.set("allowedUsers", allowed);
    }
}
