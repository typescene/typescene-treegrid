import { BrowserApplication } from "@typescene/webapp";
import { MainActivity } from "./main/activity";

/** The application itself */
export class Application extends BrowserApplication.with(
    MainActivity
) {
    async onManagedStateActivatingAsync() {
        await super.onManagedStateActivatingAsync();

        // ... add pre-initialization code here
    }
}
