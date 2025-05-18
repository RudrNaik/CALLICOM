import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import background from "./assets/Images/4060492.jpg";


function Login() {
  const { isLoggedIn, login } = useContext(AuthContext);
  const [userInfo, setUserInfo] = useState({ userName: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login({ userName: userInfo.userName });
        alert("Login successful!");
        navigate("/");
      } else {
        alert("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("An error occurred during login");
    }
  };

  return (
    <div
      className="bg-repeat w-screen min-h-screen bg-cover"
      style={{ backgroundImage: `url(${background})` }}
    >
      <Navbar />
      <div className="pt-16"></div>

      <form
        onSubmit={handleSubmit}
        className="text-white flex flex-col p-6 max-w-md mx-auto"
      >
        <div className="border border-orange-500 border-l-4 p-6 w-full bg-neutral-950/80  font-[Geist_Mono]">
          <h1 className="text-4xl font-bold p-2 bg-orange-500">
            LOGIN ::/
          </h1>
          <h2 class="text-sm">
            <span className="text-orange-500 ">CALLI/COM</span> UNCC IDENT
            SERVICE // LOGIN
          </h2>
          <p class="text-xs py-2 text-neutral-400/80">
            {">"}//[CALLI:COM USERIDENT]:: Input: User & Password
          </p>
          <p class="text-sm py-3 px-3 text-orange-400/80 border-l-4 border-orange-400">
            Log in to access registered characters and the character manager.
          </p>

          <h3 className="text-lg text-white font-semibold text-center">
            Log In
          </h3>

          <label>Username:</label>
          <input
            type="text"
            name="userName"
            value={userInfo.userName}
            onChange={handleChange}
            placeholder="------"
            className="border border-orange-400 border-l-4 p-2 w-full mb-4 rounded-none bg-neutral-950/80 text-white"
          />

          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={userInfo.password}
            onChange={handleChange}
            placeholder="------"
            className="border border-orange-400 border-l-4 p-2 w-full mb-4 rounded-none bg-neutral-950/80 text-white"
          />

          <button
            type="submit"
            className="border border-orange-500 hover:bg-orange-500 text-white py-2 w-full mb-4 mt-4 cursor-pointer"
          >
            Log In
          </button>

          <button
            type="button"
            className="border border-orange-500 hover:bg-orange-500 text-white py-2 w-full cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Create an Account
          </button>
        </div>
      </form>

      <Footer />
    </div>
  );
}

export default Login;
