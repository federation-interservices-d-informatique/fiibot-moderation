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
                name: "allow",
                description:
                    "Permettre un utilisateur de passer à travers le raidmode",
                options: [
                    {
                        type: "STRING",
                        name: "utilisateur",
                        required: true,
                        description: "L'utilisateur à autoriser"
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
        const allowed: string[] =
            (this.data.get("allowedUsers") as string[]) || [];
        allowed.push(user);

        inter.reply(
            `Utilisateur autorisé!\nListe des utilisateurs autorisés: ${allowed.join(
                ", "
            )}`
        );
        this.data.set("allowedUsers", allowed);
    }
}
