"use client";

import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<NodeListOf<HTMLElement>>();
  const submitRef = useRef<HTMLButtonElement>(null);
  const [hasBounced, setHasBounced] = useState(false);

  useEffect(() => {
    eyesRef.current = document.querySelectorAll(
      ".eye"
    ) as NodeListOf<HTMLElement>;

    const handleMouseMove = (event: MouseEvent) => {
      if (
        !passwordRef.current?.matches(":focus") &&
        !passwordRef.current?.matches(":invalid")
      ) {
        if (eyesRef.current) {
          for (const eye of eyesRef.current) {
            const rect = eye.getBoundingClientRect();
            const x = rect.left + 10;
            const y = rect.top + 10;
            const rad = Math.atan2(event.pageX - x, event.pageY - y);
            const rot = rad * (180 / Math.PI) * -1 + 180;
            eye.style.transform = `rotate(${rot}deg)`;
          }
        }
      }
    };

    const handleFocusPassword = () => {
      if (faceRef.current) {
        faceRef.current.style.transform = "translateX(30px)";
      }
      if (eyesRef.current) {
        for (const eye of eyesRef.current) {
          eye.style.transform = `rotate(100deg)`;
        }
      }
    };

    const handleFocusOutPassword = () => {
      if (faceRef.current) {
        faceRef.current.style.transform = "translateX(0)";
      }
      if (passwordRef.current?.checkValidity()) {
        ballRef.current?.classList.toggle("sad");
      } else {
        ballRef.current?.classList.toggle("sad");
        if (eyesRef.current) {
          for (const eye of eyesRef.current) {
            eye.style.transform = `rotate(215deg)`;
          }
        }
      }
    };

    const handleSubmitMouseOver = () => {
      ballRef.current?.classList.add("look_at");
    };

    const handleSubmitMouseOut = () => {
      ballRef.current?.classList.remove("look_at");
    };

    // Only run bounce animation once
    if (!hasBounced) {
      const timer = setTimeout(() => {
        if (ballRef.current) {
          ballRef.current.style.animation = "none";
          ballRef.current.offsetHeight; // Trigger reflow
          ballRef.current.style.animation = "bounce 3s ease-out forwards";
        }
        setHasBounced(true);
      }, 100);
      return () => clearTimeout(timer);
    }

    document.addEventListener("mousemove", handleMouseMove);
    passwordRef.current?.addEventListener("focus", handleFocusPassword);
    passwordRef.current?.addEventListener("focusout", handleFocusOutPassword);
    submitRef.current?.addEventListener("mouseover", handleSubmitMouseOver);
    submitRef.current?.addEventListener("mouseout", handleSubmitMouseOut);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      passwordRef.current?.removeEventListener("focus", handleFocusPassword);
      passwordRef.current?.removeEventListener(
        "focusout",
        handleFocusOutPassword
      );
      submitRef.current?.removeEventListener(
        "mouseover",
        handleSubmitMouseOver
      );
      submitRef.current?.removeEventListener("mouseout", handleSubmitMouseOut);
    };
  }, [hasBounced]);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        await signIn({
          email,
          idToken,
        });

        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 p-6">
      <section className="flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
          {isSignIn ? "Log in to your Account" : "Create your Account"}
        </h1>
        <p className="text-gray-700 text-center mb-8">
          {isSignIn
            ? "Welcome back! Please, enter your information"
            : "Get started by creating your account"}
        </p>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full max-w-[420px]"
          >
            {!isSignIn && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Name
                </label>
                <input
                  {...form.register("name")}
                  type="text"
                  className="w-full h-[52px] border border-gray-500 rounded-xl px-5 py-4 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 outline-none transition-all"
                  placeholder="Your Name"
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email
              </label>
              <input
                {...form.register("email")}
                type="email"
                className="w-full h-[52px] border border-gray-500 rounded-xl px-5 py-4 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 outline-none transition-all"
                placeholder="Your email address"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...form.register("password")}
                  type="password"
                  className="w-full h-[52px] border border-gray-500 rounded-xl px-5 py-4 focus:border-gray-900 focus:ring-4 focus:ring-gray-200 outline-none transition-all pr-12"
                  placeholder="Enter your password"
                  ref={passwordRef}
                />
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mb-7">
              <label className="text-sm text-gray-900 font-medium flex items-center cursor-pointer">
                <input type="checkbox" className="hidden" />
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-[52px] bg-gray-900 text-white font-semibold rounded-full hover:shadow-lg transition-shadow"
              ref={submitRef}
            >
              {isSignIn ? "Log In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        <p className="text-sm text-center mt-8">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
          <br />
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="text-blue-600 font-medium"
          >
            {isSignIn ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </section>

      <section className="hidden lg:flex items-center justify-center bg--50 rounded-3xl overflow-hidden relative">
        <div
          id="ball"
          className="relative z-10"
          ref={ballRef}
          style={{
            animation: hasBounced ? "none" : "bounce 6s ease-out forwards",
          }}
        >
          <div className="w-[300px] h-[300px] rounded-full bg-blue-600 relative">
            <div id="face" className="absolute inset-0" ref={faceRef}>
              <div className="flex gap-[60px] mt-[50px] justify-center">
                <div className="eye_wrap w-[30px] h-[30px] overflow-hidden animate-blink">
                  <span className="eye block w-[30px] h-[30px] bg-white rounded-full p-[3px]">
                    <span className="block w-[15px] h-[15px] bg-black rounded-full"></span>
                  </span>
                </div>
                <div className="eye_wrap w-[30px] h-[30px] overflow-hidden animate-blink">
                  <span className="eye block w-[30px] h-[30px] bg-white rounded-full p-[3px]">
                    <span className="block w-[15px] h-[15px] bg-black rounded-full"></span>
                  </span>
                </div>
              </div>
              <div className="ball__mouth w-[30px] h-[30px] rounded-full bg-black mt-[10px] mx-auto clip-path-mouth transition-all"></div>
            </div>
          </div>
        </div>
        {/* <div className="absolute bottom-[40px] w-[240px] h-[20px] bg-black/5 rounded-full shadow-md animate-shrink"></div> */}
      </section>
    </main>
  );
};

export default AuthForm;
