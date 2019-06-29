import { BrowserApplication } from "@typescene/webapp";
import { logUnhandledException } from "typescene";
import { MainActivity } from "./main/activity";

// create a new Application instance, remove old one (on dev server)
main().catch(logUnhandledException);
async function main() {
    let app = (window as any).app;
    if (typeof app === "object" && app.destroyAsync) {
        await app.destroyAsync();
    }
    app = BrowserApplication.run(MainActivity);
    await app.activateAsync();

    console.log("Application is now active");
}
