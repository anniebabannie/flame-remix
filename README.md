# Using FLAME with Remix

This is a sample app demonstrating how one could implement the FLAME pattern in a Remix app.

## What is FLAME?

FLAME stands for Fleeting Lambda Application for Modular Execution. It auto-scales tasks simply by wrapping any existing code in a function and having that block of code run in a temporary copy of the app.

In JavaScript, it might look something like this:

```javascript
function doSomeWork(id) { ... }

// run `doSomeWork` on another machine
export default flame(doSomeWork, ...)
```

FLAME removes the [FaaS labyrinth of complexity](https://fly.io/blog/rethinking-serverless-with-flame/#solving-a-problem-vs-removing-the-problem) and is cloud-provider agnostic. While the Elixir library that Chris wrote is designed specifically for spinning up Machines on Fly.io, FLAME is a pattern that can be used on any cloud that provides an API for spinning up instances of your application.

For a more thorough rundown of FLAME, be sure to read Chris’s full article here: [FLAME: Rethinking Serverless](https://fly.io/blog/rethinking-serverless-with-flame/)

## Run this app on Fly.io

While FLAME is a cloud provider agnostic, this sample app is meant to run on Fly.io and spin up copies of your app using the Fly Machines API. 

All you need to do is run:

```cmd
fly launch
fly deploy
```

You'll need to change the name of the application in your `fly.toml`, or change it when prompted in `fly launch`.

Once deployed, you can view your app at `https://<your-app-name>.fly.dev` and follow along with what's happening behind the scenes in the logs:

```cmd
fly logs
```

All this app does is add two numbers together, but this task is meant to be a stand-in for more resource-intensive work that you'd want to be able to scale horizontally.