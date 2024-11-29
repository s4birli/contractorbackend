import express from "express";

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (_req: any, res: any) => {
    return res.send("Express Typescript on Vercel");
});

app.get("/ping", (_req: any, res: any) => {
    return res.send("pong 🏓");
});

app.get("/pong", (_req: any, res: any) => {
    return res.send("ping 🏓");
});

app.listen(port, () => {
    return console.log(`Server is listening on ${port}`);
});