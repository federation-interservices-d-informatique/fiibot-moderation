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
                description: "Activer le mode raid"
            },
            {
                ownerOnly: true
            }
        );
    }
    async run(inter: CommandInteraction): Promise<void> {
        if (this.data.get("raidmode")) {
            inter.reply("Le raidmode était activé. Il a été désactivé");
            this.data.set("raidmode", false);
        } else {
            inter.reply("Le raidmode a été activé!");
            this.data.set("raidmode", true);
        }
    }
}
