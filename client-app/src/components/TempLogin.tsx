import React from "react";

interface TempLoginProps {
  setOsState: React.Dispatch<
    React.SetStateAction<
      "login" | "select_case" | "create_case" | "case_dashboard"
    >
  >;
  setUser: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
    } | null>
  >;
}

const TempLogin = ({ setOsState, setUser }: TempLoginProps) => {
  const [userIdInput, setUserIdInput] = React.useState("");

  const handleUserIdSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setUser({ name: userIdInput, email: `${userIdInput}@example.com` });
    setOsState("select_case");
  };

  return (
    <>
      <div className="flex flex-1 items-center justify-center p-6">
        <form
          className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          onSubmit={handleUserIdSubmit}
        >
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Enter user ID
            </h1>
            <p className="text-sm text-gray-600">
              Temporary prototype access for backend testing.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            User ID
            <input
              autoFocus
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-500"
              onChange={(event) => setUserIdInput(event.target.value)}
              placeholder="Enter any user ID"
              type="text"
              value={userIdInput}
            />
          </label>

          <button
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            type="submit"
          >
            Continue
          </button>
        </form>
      </div>
    </>
  );
};

export default TempLogin;
