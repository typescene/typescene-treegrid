import { logUnhandledException } from "typescene";
import { Application } from "./app";

// create a new Application instance, remove old one (on dev server)
main().catch(logUnhandledException);
async function main() {
    let app = (window as any).app;
    if (typeof app === "object" && app.destroyAsync) {
        await app.destroyAsync();
    }
    app = new Application();
    await app.activateAsync();

    console.log("Application is now active");
}
