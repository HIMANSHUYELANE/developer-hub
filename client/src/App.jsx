import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.baseURL = API_URL;

const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = (nextToken, userData) => {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
    <header className="border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-8 w-8  text-lime-300 rounded-lg bg-primary-500 flex items-center justify-center text-3xl font-bold">
            D
          </span>
          <span className="font-semibold tracking-tight">
            Developer Project Collaboration Hub
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/login" className="text-slate-300 hover:text-white">
            Login
          </Link>
          <Link
            to="/signup"
            className="px-3 py-1.5 rounded-md bg-primary-500 hover:bg-primary-600 text-sm font-medium"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
    <main className="flex-1">{children}</main>
    <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
      Built for final year projects – clean and beginner friendly.
    </footer>
  </div>
);

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-64 border-r border-slate-800 hidden md:flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800 flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center text-xs font-bold">
            D
          </span>
          <div>
            <div className="text-sm font-semibold">Dev Collab Hub</div>
            <div className="text-xs text-slate-400">
              Find teammates & projects
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 text-sm space-y-1">
          <NavItem to="/dashboard">Dashboard</NavItem>
          <NavItem to="/projects/create">Create project</NavItem>
          <NavItem to="/projects">Browse projects</NavItem>
          <NavItem to="/search/developers">Search developers</NavItem>
          <NavItem to="/profile">My profile</NavItem>
        </nav>
        <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="font-medium text-slate-200">{user?.name}</div>
          <button
            onClick={logout}
            className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="font-semibold text-sm">Dev Collab Hub</span>
          <button
            onClick={logout}
            className="text-xs px-2 py-1 rounded border border-slate-700 hover:bg-slate-800"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-2 py-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 text-sm"
    >
      <span className="h-1 w-1 rounded-full bg-slate-500" />
      <span>{children}</span>
    </Link>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [randomProjects, setRandomProjects] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(true);

  useEffect(() => {
    const loadRandom = async () => {
      try {
        const res = await axios.get("/projects/public?limit=6");
        setRandomProjects(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRandom(false);
      }
    };
    loadRandom();
  }, []);

  const handleProjectClick = (id) => {
    if (user) {
      navigate(`/projects/${id}`);
    } else {
      navigate("/login");
    }
  };

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 py-16 grid gap-10 md:grid-cols-2 items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full bg-slate-900 border border-slate-700 mb-4 text-primary-300">
            Final-year friendly
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Find developers.
            <br />
            Build real projects together.
          </h1>
          <p className="text-sm md:text-base text-slate-300 mb-6">
            Developer Project Collaboration Hub helps you post project ideas,
            discover teammates by skills, and track join requests – all with a
            clean, explainable codebase for viva.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="px-4 py-2 border-2 border-white text-lime-300 hover:bg-black rounded-md bg-primary-500 hover:bg-primary-600 text-sm font-medium"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg shadow-xs shadow-lime-300 border border-slate-700 hover:border-primary-500 text-sm font-medium text-slate-200"
            >
              I already have an account
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-xs text-slate-400">
            <div>
              <div className="text-lg font-semibold text-white">JWT</div>
              <div>Secure auth</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">MongoDB</div>
              <div>Clean models</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Express</div>
              <div>Simple APIs</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border shaw border-slate-800 bg-slate-950/60 p-5 shadow-xl shadow-slate-700">
          <div className="text-xs text-slate-400 mb-2">Example dashboard</div>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <StatCard label="My projects" value="3" />
              <StatCard label="Pending requests" value="2" />
              <StatCard label="Teammates" value="6" />
            </div>
            <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/60">
              <div className="text-xs font-medium mb-2 text-slate-200">
                Open Source Issue Tracker
              </div>
              <div className="text-[11px] text-slate-400 mb-2">
                Looking for React + Node developers to build an issue tracker
                for open source maintainers.
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge>React</Badge>
                <Badge>Node.js</Badge>
                <Badge>MongoDB</Badge>
              </div>
            </div>
            <div className="border border-dashed border-slate-700 rounded-xl p-3 text-xs text-slate-400">
              When you log in, you will see your own stats, projects, and
              requests here.
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-sm font-semibold text-slate-100 mb-3">
          Explore projects from other developers
        </h2>
        {loadingRandom ? (
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 animate-pulse"
              >
                <div className="h-3 w-24 bg-slate-800 rounded mb-2" />
                <div className="h-3 w-full bg-slate-900 rounded mb-1" />
                <div className="h-3 w-2/3 bg-slate-900 rounded" />
              </div>
            ))}
          </div>
        ) : randomProjects.length === 0 ? (
          <p className="text-xs text-slate-400">
            No projects available yet. Be the first to create one!
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            {randomProjects.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => handleProjectClick(p._id)}
                className="text-left rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-primary-500 hover:bg-slate-900/80 transition-colors"
              >
                <div className="text-sm font-medium text-slate-100 mb-1 line-clamp-1">
                  {p.title}
                </div>
                <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">
                  {p.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{p.owner?.name || "Anonymous"}</span>
                  <span>{p.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

const StatCard = ({ label, value }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
    <div className="text-[11px] text-slate-400">{label}</div>
    <div className="text-lg font-semibold text-white">{value}</div>
  </div>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-lg shadow-2xs shadow-lime-300 bg-slate-900 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200">
    {children}
  </span>
);

const AuthPage = ({ mode }) => {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;
      const res = await axios.post(endpoint, payload);
      login(res.data.token, res.data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-slate-900/60">
          <h2 className="text-xl font-semibold mb-2">
            {isLogin
              ? "Welcome back, developer"
              : "Create your developer account"}
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            {isLogin
              ? "Sign in to access your dashboard, projects, and collaboration requests."
              : "Sign up and start posting projects, searching developers, and collaborating."}
          </p>
          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {!isLogin && (
              <div>
                <label className="block text-xs mb-1 text-slate-300">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div>
              <label className="block text-xs mb-1 text-slate-300">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-md border-2 hover:scale-105 bg-primary-500 hover:bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isLogin
                  ? "Login"
                  : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-400">
            {isLogin ? (
              <>
                New here?{" "}
                <Link
                  className="text-primary-300 hover:text-primary-200"
                  to="/signup"
                >
                  Create an account
                </Link>
                .
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link
                  className="text-primary-300 hover:text-primary-200"
                  to="/login"
                >
                  Login
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

const DashboardPage = () => {
  const { token } = useAuth();
  const [data, setData] = useState({
    myProjects: [],
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [projectsRes, incomingRes, outgoingRes] = await Promise.all([
          axios.get("/projects/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/requests/incoming", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/requests/outgoing", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setData({
          myProjects: projectsRes.data || [],
          incoming: incomingRes.data || [],
          outgoing: outgoingRes.data || [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="My projects" value={data.myProjects.length} />
        <StatCard
          label="Incoming requests"
          value={data.incoming.filter((r) => r.status === "Pending").length}
        />
        <StatCard
          label="Outgoing requests"
          value={data.outgoing.filter((r) => r.status === "Pending").length}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <SectionHeader
            title="My projects"
            linkText="Create"
            linkTo="/projects/create"
          />
          <div className="space-y-3">
            {data.myProjects.length === 0 && (
              <EmptyState message="You have not created any projects yet." />
            )}
            {data.myProjects.map((p) => (
              <Card key={p._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/projects/${p._id}`}
                      className="font-medium text-slate-100 hover:text-primary-300 text-sm"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.requiredSkills?.slice(0, 4).map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] rounded-full px-2 py-0.5 border border-slate-700 text-slate-300">
                    {p.status}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div>
            <SectionHeader title="Requests received" />
            <div className="space-y-3">
              {data.incoming.length === 0 && (
                <EmptyState message="No one has requested to join your projects yet." />
              )}
              {data.incoming.slice(0, 5).map((r) => (
                <RequestRow key={r._id} request={r} mode="incoming" />
              ))}
            </div>
          </div>
          <div>
            <SectionHeader title="Requests sent" />
            <div className="space-y-3">
              {data.outgoing.length === 0 && (
                <EmptyState message="You have not requested to join any projects yet." />
              )}
              {data.outgoing.slice(0, 5).map((r) => (
                <RequestRow key={r._id} request={r} mode="outgoing" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

const PageLoading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <div className="h-5 w-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

const Card = ({ children }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
    {children}
  </div>
);

const SectionHeader = ({ title, linkText, linkTo }) => (
  <div className="flex items-center justify-between mb-2">
    <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
    {linkText && linkTo && (
      <Link
        to={linkTo}
        className="text-[11px] text-primary-300 hover:text-primary-200 border border-slate-700 rounded-full px-2 py-0.5"
      >
        {linkText}
      </Link>
    )}
  </div>
);

const EmptyState = ({ message }) => (
  <div className="rounded-xl border border-dashed border-slate-700 px-3 py-3 text-xs text-slate-400">
    {message}
  </div>
);

const RequestRow = ({ request, mode }) => {
  const { token } = useAuth();
  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState(false);

  const isIncoming = mode === "incoming";

  const handleUpdate = async (nextStatus) => {
    setLoading(true);
    try {
      const res = await axios.patch(
        `/requests/${request._id}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStatus(res.data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] text-slate-300">
            {isIncoming ? request.sender?.name : request.recipient?.name}
          </div>
          <div className="text-[11px] text-slate-400">
            Project:{" "}
            <span className="text-slate-200">{request.project?.title}</span>
          </div>
          {request.message && (
            <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
              {request.message}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] rounded-full px-2 py-0.5 border border-slate-700 text-slate-300">
            {status}
          </span>
          {isIncoming && status === "Pending" && (
            <div className="flex gap-1">
              <button
                disabled={loading}
                onClick={() => handleUpdate("Accepted")}
                className="px-2 py-0.5 rounded-full border border-emerald-500/60 text-[11px] text-emerald-300 hover:bg-emerald-500/10"
              >
                Accept
              </button>
              <button
                disabled={loading}
                onClick={() => handleUpdate("Rejected")}
                className="px-2 py-0.5 rounded-full border border-red-500/60 text-[11px] text-red-300 hover:bg-red-500/10"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const ProfilePage = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await axios.put(
        "/users/me",
        {
          name: profile.name,
          bio: profile.bio,
          experienceLevel: profile.experienceLevel,
          github: profile.github,
          skills: profile.skills?.join
            ? profile.skills.join(", ")
            : profile.skills,
          techStack: profile.techStack?.join
            ? profile.techStack.join(", ")
            : profile.techStack,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;
  if (!profile) return <EmptyState message="Could not load profile." />;

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold mb-4">My profile</h1>
      <div className="max-w-2xl">
        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 text-slate-300">Name</label>
              <input
                type="text"
                name="name"
                value={profile.name || ""}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Experience level
              </label>
              <select
                name="experienceLevel"
                value={profile.experienceLevel || "Beginner"}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-300">Bio</label>
            <textarea
              name="bio"
              rows={3}
              value={profile.bio || ""}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              placeholder="Short introduction, interests, and what you want to build."
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-300">
              Skills (comma separated)
            </label>
            <input
              type="text"
              name="skills"
              value={
                Array.isArray(profile.skills)
                  ? profile.skills.join(", ")
                  : profile.skills || ""
              }
              onChange={(e) =>
                setProfile({
                  ...profile,
                  skills: e.target.value,
                })
              }
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              placeholder="React, Node.js, MongoDB"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-300">
              Tech stack (comma separated)
            </label>
            <input
              type="text"
              name="techStack"
              value={
                Array.isArray(profile.techStack)
                  ? profile.techStack.join(", ")
                  : profile.techStack || ""
              }
              onChange={(e) =>
                setProfile({
                  ...profile,
                  techStack: e.target.value,
                })
              }
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              placeholder="MERN, Next.js, etc."
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-300">
              GitHub link
            </label>
            <input
              type="url"
              name="github"
              value={profile.github || ""}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              placeholder="https://github.com/username"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary-500 hover:bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

const CreateProjectPage = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    teamSize: 3,
    status: "Planning",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post(
        "/projects",
        {
          title: form.title,
          description: form.description,
          requiredSkills: form.requiredSkills,
          teamSize: Number(form.teamSize),
          status: form.status,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setForm({
        title: "",
        description: "",
        requiredSkills: "",
        teamSize: 3,
        status: "Planning",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Could not create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold mb-4">Create a new project</h1>
      <div className="max-w-2xl">
        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs mb-1 text-slate-300">
              Project title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              placeholder="Real-time Dev Chat"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-300">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              placeholder="What are you building? Who are you looking for? What is the goal of this project?"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1 text-slate-300">
                Required skills (comma separated)
              </label>
              <input
                type="text"
                name="requiredSkills"
                value={form.requiredSkills}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-slate-300">
                Team size
              </label>
              <input
                type="number"
                name="teamSize"
                min={1}
                value={form.teamSize}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              />
              <label className="block text-xs mb-1 text-slate-300 mt-3">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
              >
                <option>Planning</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>On Hold</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-primary-500 hover:bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create project"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};

const ProjectsListPage = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ skill: "", status: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/projects", {
          params: {
            skill: filters.skill || undefined,
            status: filters.status || undefined,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, filters]);

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold mb-4">Projects</h1>
      <div className="flex flex-wrap items-end gap-3 mb-4 text-sm">
        <div>
          <label className="block text-xs mb-1 text-slate-300">
            Filter by skill
          </label>
          <input
            type="text"
            value={filters.skill}
            onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
            placeholder="React, Node, etc."
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-slate-300">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
          >
            <option value="">All</option>
            <option>Planning</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>On Hold</option>
          </select>
        </div>
      </div>
      {loading ? (
        <PageLoading />
      ) : (
        <div className="space-y-3 text-xs">
          {projects.length === 0 && <EmptyState message="No projects found." />}
          {projects.map((p) => (
            <Link to={`/projects/${p._id}`}>
              <Card key={p._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-lime-300 hover:text-primary-300 text-sm">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1 w-fit">
                      {p.requiredSkills?.slice(0, 4).map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>Owner: {p.owner?.name}</div>
                    <div>Members: {p.members?.length || 1}</div>
                    <div className="mt-1 inline-flex rounded-full border border-slate-700 px-2 py-0.5 text-slate-200">
                      {p.status}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

const ProjectDetailsPage = () => {
  const { token, user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [error, setError] = useState("");
  const projectId = window.location.pathname.split("/").pop();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, projectId]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        "/requests",
        { projectId, message },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRequestStatus(res.data.status);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Could not send request");
    }
  };

  if (loading) return <PageLoading />;
  if (!project) return <EmptyState message="Project not found." />;

  const isOwner = String(project.owner?._id) === String(user?.id);
  const isMember = project.members?.some(
    (m) => String(m._id) === String(user?.id),
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">{project.title}</h1>
          <p className="text-xs text-slate-400">
            Owner: <span className="text-slate-200">{project.owner?.name}</span>{" "}
            · Status: <span className="text-slate-200">{project.status}</span>
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Team size target: {project.teamSize} · Current members:{" "}
          {project.members?.length || 1}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 text-sm">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold mb-2 text-slate-100">
              Description
            </h2>
            <p className="text-xs text-slate-300 whitespace-pre-line">
              {project.description}
            </p>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold mb-2 text-slate-100">
              Required skills
            </h2>
            <div className="flex flex-wrap gap-1">
              {project.requiredSkills?.length ? (
                project.requiredSkills.map((s) => <Badge key={s}>{s}</Badge>)
              ) : (
                <span className="text-xs text-slate-400">
                  No specific skills listed.
                </span>
              )}
            </div>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold mb-2 text-slate-100">
              Members
            </h2>
            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
              {project.members?.map((m) => (
                <span
                  key={m._id}
                  className="inline-flex items-center rounded-full bg-slate-900 border border-slate-700 px-2 py-0.5"
                >
                  {m.name}
                </span>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold mb-2 text-slate-100">
              Join this project
            </h2>
            {isOwner && (
              <p className="text-xs text-slate-400">
                You are the owner of this project. Other developers can send you
                join requests.
              </p>
            )}
            {!isOwner && isMember && (
              <p className="text-xs text-slate-400">
                You are already a member of this project.
              </p>
            )}
            {!isOwner && !isMember && (
              <form onSubmit={handleJoin} className="space-y-3 text-xs">
                {error && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {error}
                  </div>
                )}
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-primary-500"
                  placeholder="Say who you are, what you can help with, and why you are interested."
                />
                <button
                  type="submit"
                  className="w-full border-2 border-slate-400 hover:text-lime-400 inline-flex items-center justify-center rounded-md bg-primary-500 hover:bg-primary-600 px-3 py-2 text-xs font-medium text-white"
                >
                  Send join request
                </button>
                {requestStatus && (
                  <p className="text-[11px] text-slate-400">
                    Current request status:{" "}
                    <span className="text-slate-200">{requestStatus}</span>
                  </p>
                )}
              </form>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const DeveloperSearchPage = () => {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ skill: "", tech: "", q: "" });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get("/users/search", {
        params: {
          skill: filters.skill || undefined,
          tech: filters.tech || undefined,
          q: filters.q || undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold mb-4">Search developers</h1>
      <form
        onSubmit={search}
        className="grid md:grid-cols-4 gap-3 text-sm mb-4 items-end"
      >
        <div>
          <label className="block text-xs mb-1 text-slate-300">Skill</label>
          <input
            type="text"
            value={filters.skill}
            onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
            placeholder="React, Node, etc."
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-slate-300">
            Tech stack
          </label>
          <input
            type="text"
            value={filters.tech}
            onChange={(e) => setFilters({ ...filters, tech: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
            placeholder="MERN, Next.js"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-slate-300">Keyword</label>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-primary-500"
            placeholder="Name, bio, etc."
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-primary-500 hover:bg-primary-600 px-4 py-2 text-sm font-medium text-white"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {loading ? (
        <PageLoading />
      ) : (
        <div className="space-y-3 text-xs">
          {results.length === 0 && (
            <EmptyState message="No developers found." />
          )}
          {results.map((u) => (
            <Card key={u._id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">
                    {u.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-1">
                    {u.experienceLevel} · {u.github || "No GitHub link"}
                  </div>
                  {u.bio && (
                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {u.bio}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {u.skills?.slice(0, 5).map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/create"
            element={
              <ProtectedRoute>
                <CreateProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search/developers"
            element={
              <ProtectedRoute>
                <DeveloperSearchPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
