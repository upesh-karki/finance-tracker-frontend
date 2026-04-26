import { About } from "../pages/About"
import { Account } from "../pages/Account"
import { Accounts } from "../pages/Accounts"
import { Home } from "../pages/Home"
import { Login } from "../pages/Login"
import { Register } from "../pages/Register"
import { Private } from "../pages/Private"

export const nav = [
     { path:     "/",         name: "Home",        element: <Home />,       isMenu: true,     isPrivate: false  },
     { path:     "/about",    name: "About",       element: <About />,      isMenu: true,     isPrivate: false  },
     { path:     "/login",    name: "Login",       element: <Login />,      isMenu: false,    isPrivate: false  },
     { path:     "/register",    name: "Register",       element: <Register />,      isMenu: true,    isPrivate: false  },
     { path:     "/private",  name: "Private",     element: <Private />,    isMenu: true,     isPrivate: true  },
     { path:     "/account",  name: "Account",     element: <Account />,    isMenu: true,     isPrivate: true  },
     { path:     "/accounts", name: "Accounts",    element: <Accounts />,   isMenu: true,     isPrivate: true  },
]