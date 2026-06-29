import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Mail, XIcon } from "lucide-react";

import Button from "#/components/ui/Button";
import { TextInputField } from "#/components/ui/form";
import { AppModalContext } from "#/context/AppModalContext";
import {
  useCurrentUserQuery,
  useUpdateUserMutation,
} from "#/api/currentUser/hooks";
import { useProfilePhotoUploadCredentialsQuery } from "#/api/s3Permissions/hooks";
import {
  createProfilePictureJpeg,
  PROFILE_PICTURE_CONTENT_TYPE,
} from "#/lib/profilePicture";

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
  const [billingEmail, setBillingEmail] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    data: userResult,
    isPending: userPending,
    error: userError,
  } = useCurrentUserQuery();

  const {
    data: profilePhotoUploadCredentialsResult,
    isPending: profilePhotoUploadCredentialsPending,
    error: profilePhotoUploadCredentialsError,
  } = useProfilePhotoUploadCredentialsQuery();

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
  const billingEmailIsValid = isValidEmail(billingEmail);

  const hasChanges =
    !!user &&
    (firstName !== (user.firstName ?? "") ||
      lastName !== (user.lastName ?? "") ||
      billingEmail !== (user.billingEmail ?? user.email ?? "") ||
      profilePictureUrl !== (user.profilePicture ?? "") ||
      !!profilePictureFile);
  const canSave = hasChanges && billingEmailIsValid;

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

    if (!profilePhotoUploadCredentialsResult?.success) {
      throw new Error("Could not load profile photo upload credentials.");
    }

    const {
      aws,
      bucketName,
      profilePictureKey,
      profilePictureUrl: uploadedProfilePictureUrl,
    } = profilePhotoUploadCredentialsResult.data;

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
  }, [
    profilePictureFile,
    profilePictureUrl,
    profilePhotoUploadCredentialsResult,
  ]);

  const saveUser = useCallback(async () => {
    if (!user || isUpdating) return;
    if (!billingEmailIsValid) return;

    setIsUpdating(true);
    setModalGuardState("locked");

    try {
      const nextProfilePictureUrl = await uploadProfilePicture();

      const payload = {
        ...(firstName !== (user.firstName ?? "") && { firstName }),
        ...(lastName !== (user.lastName ?? "") && { lastName }),
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
    billingEmail,
    billingEmailIsValid,
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

  if (userPending || profilePhotoUploadCredentialsPending) {
    return (
      <div className="w-lg max-w-[calc(100vw-3rem)] p-2 text-sm">
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

  if (userError || profilePhotoUploadCredentialsError || !user) {
    return (
      <div className="w-lg max-w-[calc(100vw-3rem)] p-2 text-sm">
        <p className="font-serif text-lg">Edit User</p>
        <p className="mt-2 text-black/60">Could not load your user profile.</p>
      </div>
    );
  }

  return (
    <div className="w-lg max-w-[calc(100vw-3rem)] p-1 text-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-lg">Edit User</p>
          <p className="mt-0.5 truncate text-black/60">{user.email}</p>
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
              <div className="flex h-full w-full items-center justify-center font-serif text-3xl">
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
          <TextInputField
            size="sm"
            label="First name"
            value={firstName}
            disabled={isUpdating}
            onChange={handleFirstNameChange}
          />
          <TextInputField
            size="sm"
            label="Last name"
            value={lastName}
            disabled={isUpdating}
            onChange={handleLastNameChange}
          />
          <TextInputField
            size="sm"
            className="col-span-2"
            icon={Mail}
            type="email"
            label="Billing email"
            value={billingEmail}
            disabled={isUpdating}
            onChange={handleBillingEmailChange}
            error={
              billingEmailIsValid ? undefined : "Enter a valid billing email."
            }
          />
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
