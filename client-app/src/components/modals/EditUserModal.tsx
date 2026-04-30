import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, UserRound } from "lucide-react";
import Button from "../Button";

// query functions
import { getUser } from "#/api/getUser";

const accountTierLabels = {
  FREE: "Free",
  TRIAL: "Trial",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
} as const;

const EditUserModal = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [localProfilePicture, setLocalProfilePicture] = useState<string | null>(
    null,
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userName, setUserName] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  const {
    data: { user } = {},
    isPending,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setDisplayName(user.displayName ?? "");
    setUserName(user.userName ?? "");
    setProfilePictureUrl(user.profilePicture ?? "");
    setLocalProfilePicture(null);
    setImageFailed(false);
    clearFileInput();
  }, [user, clearFileInput]);

  useEffect(() => {
    return () => {
      if (localProfilePicture?.startsWith("blob:")) {
        URL.revokeObjectURL(localProfilePicture);
      }
    };
  }, [localProfilePicture]);

  const initials = useMemo(() => {
    const firstInitial = firstName.trim()[0] ?? "";
    const lastInitial = lastName.trim()[0] ?? "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  }, [firstName, lastName]);

  const profilePicture = localProfilePicture || profilePictureUrl.trim();
  const hasChanges =
    !!user &&
    (firstName !== (user.firstName ?? "") ||
      lastName !== (user.lastName ?? "") ||
      displayName !== (user.displayName ?? "") ||
      userName !== (user.userName ?? "") ||
      profilePictureUrl !== (user.profilePicture ?? "") ||
      !!localProfilePicture);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (localProfilePicture?.startsWith("blob:")) {
      URL.revokeObjectURL(localProfilePicture);
    }

    setLocalProfilePicture(URL.createObjectURL(file));
    setImageFailed(false);
    event.currentTarget.value = "";
  };

  const resetDraft = () => {
    if (!user) return;

    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setDisplayName(user.displayName ?? "");
    setUserName(user.userName ?? "");
    setProfilePictureUrl(user.profilePicture ?? "");
    setLocalProfilePicture(null);
    setImageFailed(false);
    clearFileInput();
  };

  if (isPending) {
    return (
      <div className="w-lg max-w-[calc(100vw-3rem)] p-2 text-xs">
        <div className="h-4 w-24 rounded bg-black/10" />
        <div className="mt-4 flex gap-4">
          <div className="h-20 w-20 rounded-full bg-black/10" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-8 rounded-lg bg-black/10" />
            <div className="h-8 rounded-lg bg-black/10" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="w-lg max-w-[calc(100vw-3rem)] p-2 text-xs">
        <p className="font-serif text-base">Edit User</p>
        <p className="mt-2 text-gray-600">Could not load your user profile.</p>
      </div>
    );
  }

  return (
    <div className="w-lg max-w-[calc(100vw-3rem)] p-1 text-xs">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-base">Edit User</p>
          <p className="mt-0.5 truncate text-gray-600">{user.email}</p>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-black/10 bg-black/5 px-2 py-1 text-[0.7rem]">
          <BadgeCheck className="h-3.5 w-3.5" />
          <span>{accountTierLabels[user.accountTier]}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex w-28 shrink-0 flex-col items-center gap-2">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-black/15 bg-black/10">
            {profilePicture && !imageFailed ? (
              <img
                src={profilePicture}
                alt={`${firstName} ${lastName}`.trim() || "Profile picture"}
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-2xl">
                {initials}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            text="Upload"
            style="secondary"
            icon="upload"
            onClick={() => fileInputRef.current?.click()}
            fullWidth
          />
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-gray-600">First name</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors focus:border-black/40"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-gray-600">Last name</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors focus:border-black/40"
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-gray-600">Display name</span>
            <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white/70 px-2 transition-colors focus-within:border-black/40">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-2 outline-none"
              />
            </div>
          </label>
          {/* 
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-gray-600">Username</span>
            <input
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="caseos-user"
              className="rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors placeholder:text-gray-400 focus:border-black/40"
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-gray-600">Profile picture URL</span>
            <input
              value={profilePictureUrl}
              onChange={(event) => {
                setProfilePictureUrl(event.target.value);
                setLocalProfilePicture(null);
                setImageFailed(false);
                clearFileInput();
              }}
              placeholder="https://..."
              className="rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors placeholder:text-gray-400 focus:border-black/40"
            />
          </label> */}
        </div>
      </div>
      {/* 
      <div className="mt-4 rounded-xl border border-black/10 bg-black/5 p-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Mail className="h-3.5 w-3.5" />
          <span className="truncate">{user.billingEmail || user.email}</span>
        </div>
      </div> */}

      <div className="mt-4 flex justify-end gap-2">
        <Button
          text="Reset"
          style="secondary"
          icon="reset"
          onClick={resetDraft}
          disabled={!hasChanges}
          initiallyDisabled
        />

        <Button
          text="Save"
          icon="save"
          disabled={!hasChanges}
          initiallyDisabled
        />
      </div>
    </div>
  );
};

export default EditUserModal;
