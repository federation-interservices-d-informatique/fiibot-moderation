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
                name: "raidmode",
                description: "Activer le mode raid",
                options: [
                    {
                        type: "SUB_COMMAND",
                        name: "enable",
                        description: "Activer le raidmode"
                    },
                    {
                        type: "SUB_COMMAND",
                        name: "disable",
                        description: "Désactiver le raimode"
                    }
                ]
            },
            {
                ownerOnly: true
            }
        );
    }
    async run(inter: CommandInteraction): Promise<void> {
        if (inter.options.getSubcommand() === "enable") {
            inter.reply("Le raidmode a été activé!");
            this.data.set("raidmode", true);
        } else if (inter.options.getSubcommand() === "disable") {
            inter.reply("Le raidmode a été désactivé");
            this.data.set("raidmode", false);
        }
    }
}
