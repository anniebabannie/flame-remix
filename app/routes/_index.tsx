import type { MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
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
  let sum:number = 0;
  try {
    console.log('running our math function...')
    sum = await runMath(a, b);
  } catch (error) {
    console.log('there was an error running math')
    console.log(error)
    return json({ error: error }, { status: 500 });
  }
  
  return json({ sum });
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-24">
      <h1>FLAME on Remix</h1>
      <Form action="/?index" method="post" className="flex gap-8">
        <input type="number" name="firstNum" placeholder="Number..."/>
        <input type="number" name="secondNum" placeholder="Another number..."/>
        <input type="submit" value="Add numbers" disabled={navigation.state === "submitting"}/>
      </Form>
      <p className="text-5xl">The sum is: &nbps;
        {navigation.state === "submitting" && 
          <span className="text-gray-400"> calculating...</span>
        }
        {actionData && 
        <span className="font-black">{actionData.sum}</span>
        }
      </p>
    </div>
  );
}
