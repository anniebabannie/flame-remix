import type { MetaFunction } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { ActionFunctionArgs, json } from "react-router";
import runMath from "../runMath.server.js";


export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const a = formData.get("firstNum") as string;
  const b = formData.get("secondNum") as string;
  if (!a || !b) return json({ error: "Please provide two numbers" }, { status: 400 });
  try {
    console.log('running math')
    const sum = await runMath(a, b);
    console.log('results of math')
    console.log(sum) 
  } catch (error) {
    console.log('there was a math error')
    console.log(error)
    return json({ error: error }, { status: 500 });
  }
  
  return json({ sum: parseInt(a) + parseInt(b) });
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      {actionData &&
        <p>The sum is: {actionData.sum}</p>
      }
      <Form action="/?index" method="post">
        <input type="number" name="firstNum"/>
        <input type="number" name="secondNum"/>
        <input type="submit" value="Run Math" />
      </Form>
    </div>
  );
}
