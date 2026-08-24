import { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Kayıt Ol | Veloria",
  description: "Veloria'ya kayıt olun.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
