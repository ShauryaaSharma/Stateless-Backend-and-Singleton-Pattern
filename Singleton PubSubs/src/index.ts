import { PubSubManager } from "./pubsub-manager";

setInterval(() => {
    PubSubManager.getInstance().userSubscriber(Math.random().toString(), "APPL");
}, 5000)