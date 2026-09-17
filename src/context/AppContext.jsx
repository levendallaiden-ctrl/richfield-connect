import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);
const USER_KEY = "richfieldConnectUser";
const ACCOUNTS_KEY = "richfieldConnectAccounts";
const POSTS_KEY = "richfieldConnectPosts";

function readFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch {
    return fallback;
  }
}

function readAccountsList() {
  const savedAccounts = readFromStorage(ACCOUNTS_KEY, []);
  if (Array.isArray(savedAccounts) && savedAccounts.length > 0) {
    return savedAccounts;
  }

  const legacyUser = readFromStorage(USER_KEY, null);
  if (legacyUser) {
    return [legacyUser];
  }

  return [];
}

function AppProvider({ children }) {
  const [user, setUser] = useState(() => readFromStorage(USER_KEY, null));
  const [accounts, setAccounts] = useState(() => readAccountsList());
  const [posts, setPosts] = useState(() => readFromStorage(POSTS_KEY, []));
  const [toast, setToast] = useState(null);
  const [isHydrated] = useState(true);

  useEffect(() => {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }, [posts]);

  function registerUser(profileData) {
    const normalizedUser = {
      ...profileData,
      role: profileData.role === "admin" ? "admin" : "user",
      joinedDate: profileData.joinedDate || new Date().toISOString(),
    };

    setUser(normalizedUser);
    setAccounts((prevAccounts) => {
      const nextAccounts = [...prevAccounts];
      const matchIndex = nextAccounts.findIndex(
        (account) => account.email === normalizedUser.email,
      );

      if (matchIndex >= 0) {
        nextAccounts[matchIndex] = normalizedUser;
      } else {
        nextAccounts.push(normalizedUser);
      }

      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      return nextAccounts;
    });
  }

  function signIn(email, password) {
    const accountList = readAccountsList();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const savedUser = accountList.find((account) => {
      const storedEmail = String(account.email || "").trim().toLowerCase();
      const storedPassword = account.password ? String(account.password) : "";
      const matchesEmail = storedEmail === normalizedEmail;
      const matchesPassword =
        storedPassword === ""
          ? true
          : storedPassword === String(password || "");
      return matchesEmail && matchesPassword;
    });

    if (!savedUser) {
      return false;
    }

    setUser(savedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(savedUser));
    return true;
  }

  function addPost(content, attachment = null) {
    const newPost = {
      id: crypto.randomUUID(),
      username: user ? user.fullName : "Anonymous",
      timestamp: new Date().toLocaleString(),
      content,
      likes: 0,
      liked: false,
      comments: [], // new
      attachment,
    };
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  }

  function toggleLike(postId) {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post,
      ),
    );
  }

  function addComment(postId, content) {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              // Fallback handles posts saved before this feature existed —
              // their stored record has no comments field at all.
              comments: [
                ...(post.comments || []),
                {
                  id: crypto.randomUUID(),
                  username: user ? user.fullName : "Anonymous",
                  timestamp: new Date().toLocaleString(),
                  content,
                },
              ],
            }
          : post,
      ),
    );
  }

  function deleteComment(postId, commentId) {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: (post.comments || []).filter(
                (comment) => comment.id !== commentId,
              ),
            }
          : post,
      ),
    );
  }

  function deletePost(postId) {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  }

  function showToast(message, type = "info") {
    setToast({ id: Date.now(), message, type });
  }

  function clearToast() {
    setToast(null);
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }

  function clearSavedAccount() {
    setUser(null);
    setAccounts((prevAccounts) => {
      const nextAccounts = prevAccounts.filter(
        (account) => account.email !== (user ? user.email : ""),
      );
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
      localStorage.removeItem(USER_KEY);
      return nextAccounts;
    });
  }

  function resetPassword(email, newPassword) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    let updatedUser = null;
    const nextAccounts = accounts.map((account) => {
      const currentEmail = String(account.email || "").trim().toLowerCase();
      if (currentEmail !== normalizedEmail) {
        return account;
      }

      updatedUser = { ...account, password: newPassword };
      return updatedUser;
    });

    if (!updatedUser) {
      return false;
    }

    setAccounts(nextAccounts);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));

    if (user && user.email && String(user.email).trim().toLowerCase() === normalizedEmail) {
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }

    return true;
  }

  function deleteAccountByEmail(email) {
    setAccounts((prevAccounts) => {
      const nextAccounts = prevAccounts.filter(
        (account) => account.email !== email,
      );

      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));

      if (user && user.email === email) {
        setUser(null);
        localStorage.removeItem(USER_KEY);
      }

      return nextAccounts;
    });
  }

  const value = {
    user,
    accounts,
    posts,
    toast,
    isHydrated,
    registerUser,
    signIn,
    clearSavedAccount,
    resetPassword,
    deleteAccountByEmail,
    addPost,
    toggleLike,
    deletePost,
    addComment,
    deleteComment,
    showToast,
    clearToast,
    signOut,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside an <AppProvider>");
  }
  return context;
}

// The provider and its custom hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export { AppProvider, useApp };
