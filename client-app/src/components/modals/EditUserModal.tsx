import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Mail, UserRound, XIcon } from "lucide-react";

import Button from "#/components/Button";
import { AppModalContext } from "#/context/AppModalContext";
import {
  useCurrentUserQuery,
  useUpdateUserMutation,
} from "#/api/react-query/currentUser";
import { useS3PermissionsQuery } from "#/api/react-query/s3Permissions";
import {
  createProfilePictureJpeg,
  PROFILE_PICTURE_CONTENT_TYPE,
} from "#/lib/profilePicture";

const inputClass =
  "rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors focus:border-black/40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";

function getAwsRegion() {
  const region = String(import.meta.env.VITE_AWS_REGION ?? "");
  if (!region) throw new Error("Missing VITE_AWS_REGION");
  return region;
}

function getInitials(firstName: string, lastName: string) {
  return (
    `${firstName.trim()[0] ?? ""}${lastName.trim()[0] ?? ""}`.toUpperCase() ||
    "U"
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const EditUserModal = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setModal, requestCloseModal, setModalGuardState } =
    useContext(AppModalContext);

  const [imageFailed, setImageFailed] = useState(false);
  const [localProfilePicture, setLocalProfilePicture] = useState<string | null>(
    null,
  );
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data: userResult,
    isPending: userPending,
    error: userError,
  } = useCurrentUserQuery();

  const {
    data: s3PermissionsResult,
    isPending: s3PermissionsPending,
    error: s3PermissionsError,
  } = useS3PermissionsQuery();

  const updateUserMutation = useUpdateUserMutation();

  const user = userResult?.currentUser.user;

  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const closeModal = useCallback(() => {
    requestCloseModal();
  }, [requestCloseModal]);

  const handleImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  const openFilePicker = useCallback(() => {
    if (isUpdating) return;
    fileInputRef.current?.click();
  }, [isUpdating]);

  const handleFirstNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFirstName(event.target.value);
    },
    [],
  );

  const handleLastNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setLastName(event.target.value);
    },
    [],
  );

  const handleDisplayNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayName(event.target.value);
    },
    [],
  );

  const handleBillingEmailChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setBillingEmail(event.target.value);
    },
    [],
  );

  const resetDraft = useCallback(() => {
    if (!user || isUpdating) return;

    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setDisplayName(user.displayName ?? "");
    setBillingEmail(user.billingEmail ?? user.email ?? "");
    setProfilePictureUrl(user.profilePicture ?? "");
    setLocalProfilePicture(null);
    setProfilePictureFile(null);
    setImageFailed(false);
    clearFileInput();
  }, [clearFileInput, isUpdating, user]);

  useEffect(resetDraft, [resetDraft]);

  useEffect(() => {
    return () => {
      if (localProfilePicture?.startsWith("blob:")) {
        URL.revokeObjectURL(localProfilePicture);
      }
    };
  }, [localProfilePicture]);

  const initials = useMemo(
    () => getInitials(firstName, lastName),
    [firstName, lastName],
  );

  const profilePicture = localProfilePicture || profilePictureUrl.trim();
  const displayNameIsValid = displayName.trim().length >= 3;
  const billingEmailIsValid = isValidEmail(billingEmail);

  const hasChanges =
    !!user &&
    (firstName !== (user.firstName ?? "") ||
      lastName !== (user.lastName ?? "") ||
      displayName !== (user.displayName ?? "") ||
      billingEmail !== (user.billingEmail ?? user.email ?? "") ||
      profilePictureUrl !== (user.profilePicture ?? "") ||
      !!profilePictureFile);
  const canSave = hasChanges && displayNameIsValid && billingEmailIsValid;

  useEffect(() => {
    if (isUpdating) {
      setModalGuardState("locked");
      return;
    }

    setModalGuardState(hasChanges ? "state-modified" : "unlocked");
  }, [hasChanges, isUpdating, setModalGuardState]);

  useEffect(() => {
    return () => {
      setModalGuardState("unlocked");
    };
  }, [setModalGuardState]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isUpdating) return;

      const file = event.target.files?.[0];
      if (!file) return;

      if (localProfilePicture?.startsWith("blob:")) {
        URL.revokeObjectURL(localProfilePicture);
      }

      setLocalProfilePicture(URL.createObjectURL(file));
      setProfilePictureFile(file);
      setImageFailed(false);
      event.currentTarget.value = "";
    },
    [isUpdating, localProfilePicture],
  );

  const uploadProfilePicture = useCallback(async () => {
    if (!profilePictureFile) return profilePictureUrl;

    if (!s3PermissionsResult?.success) {
      throw new Error("Could not load S3 upload permissions.");
    }

    const {
      aws,
      bucketName,
      profilePictureKey,
      profilePictureUrl: uploadedProfilePictureUrl,
    } = s3PermissionsResult.data;

    const jpeg = await createProfilePictureJpeg(profilePictureFile);
    const body = new Uint8Array(await jpeg.arrayBuffer());

    const s3Client = new S3Client({
      region: getAwsRegion(),
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
        sessionToken: aws.sessionToken,
      },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: profilePictureKey,
        Body: body,
        ContentType: PROFILE_PICTURE_CONTENT_TYPE,
      }),
    );

    setProfilePictureUrl(uploadedProfilePictureUrl);
    return uploadedProfilePictureUrl;
  }, [profilePictureFile, profilePictureUrl, s3PermissionsResult]);

  const saveUser = useCallback(async () => {
    if (!user || isUpdating) return;
    if (!displayNameIsValid || !billingEmailIsValid) return;

    setIsUpdating(true);
    setModalGuardState("locked");

    try {
      const nextProfilePictureUrl = await uploadProfilePicture();

      const payload = {
        ...(firstName !== (user.firstName ?? "") && { firstName }),
        ...(lastName !== (user.lastName ?? "") && { lastName }),
        ...(displayName !== (user.displayName ?? "") && { displayName }),
        ...(billingEmail !== (user.billingEmail ?? user.email ?? "") && {
          billingEmail,
        }),
        ...((profilePictureFile ||
          nextProfilePictureUrl !== (user.profilePicture ?? "")) && {
          profilePicture: nextProfilePictureUrl,
        }),
      };

      if (Object.keys(payload).length === 0) {
        setModal(null);
        return;
      }

      await updateUserMutation.mutateAsync(payload);
      setModal(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("An error occurred while updating your profile. Please try again.");
    } finally {
      setIsUpdating(false);
      setModalGuardState("unlocked");
    }
  }, [
    displayName,
    billingEmail,
    billingEmailIsValid,
    displayNameIsValid,
    firstName,
    isUpdating,
    lastName,
    profilePictureFile,
    setModal,
    setModalGuardState,
    uploadProfilePicture,
    updateUserMutation,
    user,
  ]);

  if (userPending || s3PermissionsPending) {
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

  if (userError || s3PermissionsError || !user) {
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

        <button
          type="button"
          aria-label="Close modal"
          disabled={isUpdating}
          onClick={closeModal}
          className="cursor-pointer rounded-lg p-1.5 transition-colors duration-150 ease-in hover:bg-black/15 hover:duration-100 hover:ease-out disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
        >
          <XIcon className="h-5 w-5 text-black" />
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex w-28 shrink-0 flex-col items-center gap-2">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-black/15 bg-black/10">
            {profilePicture && !imageFailed ? (
              <img
                src={profilePicture}
                alt={`${firstName} ${lastName}`.trim() || "Profile picture"}
                referrerPolicy="no-referrer"
                onError={handleImageError}
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
            disabled={isUpdating}
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            text="Upload"
            style="secondary"
            icon="upload"
            onClick={openFilePicker}
            disabled={isUpdating}
            fullWidth
          />
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-gray-600">First name</span>
            <input
              value={firstName}
              disabled={isUpdating}
              onChange={handleFirstNameChange}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-gray-600">Last name</span>
            <input
              value={lastName}
              disabled={isUpdating}
              onChange={handleLastNameChange}
              className={inputClass}
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-gray-600">Display name</span>
            <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white/70 px-2 transition-colors focus-within:border-black/40">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <input
                value={displayName}
                disabled={isUpdating}
                onChange={handleDisplayNameChange}
                className="min-w-0 flex-1 bg-transparent py-2 outline-none disabled:cursor-not-allowed disabled:text-gray-400"
              />
            </div>
            {!displayNameIsValid && (
              <span className="text-[11px] text-red-600">
                Display name must be at least 3 characters.
              </span>
            )}
          </label>

          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-gray-600">Billing email</span>
            <div className="flex items-center gap-2 rounded-lg border border-black/15 bg-white/70 px-2 transition-colors focus-within:border-black/40">
              <Mail className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <input
                value={billingEmail}
                type="email"
                disabled={isUpdating}
                onChange={handleBillingEmailChange}
                className="min-w-0 flex-1 bg-transparent py-2 outline-none disabled:cursor-not-allowed disabled:text-gray-400"
              />
            </div>
            {!billingEmailIsValid && (
              <span className="text-[11px] text-red-600">
                Enter a valid billing email.
              </span>
            )}
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          text="Reset"
          style="secondary"
          icon="reset"
          onClick={resetDraft}
          disabled={isUpdating || !hasChanges}
          initiallyDisabled
        />

        <Button
          text="Save"
          icon="save"
          onClick={saveUser}
          disabled={isUpdating || !canSave}
          initiallyDisabled
        />
      </div>
    </div>
  );
};

export default EditUserModal;
