import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UserRound, XIcon } from "lucide-react";
import Button from "#/components/Button";

// context
import { AppModalContext } from "#/context/AppModalContext";

// query functions
import { getUser } from "#/api/getUser";
import { getS3Permissions } from "#/api/getS3Permissions";

const PROFILE_PICTURE_SIZE = 200;
const PROFILE_PICTURE_CONTENT_TYPE = "image/jpeg";

function getAwsRegion(): string {
  const region = String(import.meta.env.VITE_AWS_REGION ?? "");

  if (!region) {
    throw new Error("Missing VITE_AWS_REGION");
  }

  return region;
}

async function createProfilePictureJpeg(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);
  const cropSize = Math.min(image.width, image.height);
  const sourceX = (image.width - cropSize) / 2;
  const sourceY = (image.height - cropSize) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_PICTURE_SIZE;
  canvas.height = PROFILE_PICTURE_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare profile picture upload.");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    cropSize,
    cropSize,
    0,
    0,
    PROFILE_PICTURE_SIZE,
    PROFILE_PICTURE_SIZE,
  );

  image.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not convert profile picture to JPEG."));
          return;
        }

        resolve(blob);
      },
      PROFILE_PICTURE_CONTENT_TYPE,
      0.9,
    );
  });
}

const EditUserModal = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  const { setModal, modalLocked, setModalLocked } = useContext(AppModalContext);

  const {
    data: getUserResult,
    isPending: getUserPending,
    error: getUserError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });
  const user = getUserResult?.success ? getUserResult.data.user : undefined;

  const {
    data: getS3PermissionsResult,
    isPending: getS3PermissionsPending,
    error: getS3PermissionsError,
  } = useQuery({
    queryKey: ["s3Permissions"],
    queryFn: getS3Permissions,
  });

  console.log("getS3PermissionsResult:", getS3PermissionsResult);

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
    setProfilePictureUrl(user.profilePicture ?? "");
    setLocalProfilePicture(null);
    setProfilePictureFile(null);
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
      profilePictureUrl !== (user.profilePicture ?? "") ||
      !!profilePictureFile);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (localProfilePicture?.startsWith("blob:")) {
      URL.revokeObjectURL(localProfilePicture);
    }

    setLocalProfilePicture(URL.createObjectURL(file));
    setProfilePictureFile(file);
    setImageFailed(false);
    event.currentTarget.value = "";
  };

  const resetDraft = () => {
    if (!user) return;

    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setDisplayName(user.displayName ?? "");
    setProfilePictureUrl(user.profilePicture ?? "");
    setLocalProfilePicture(null);
    setProfilePictureFile(null);
    setImageFailed(false);
    clearFileInput();
  };

  const updateUser = useCallback(async () => {
    if (!user) return;
    setModalLocked(true);

    try {
      if (profilePictureFile) {
        if (!getS3PermissionsResult?.success) {
          throw new Error("Could not load S3 upload permissions.");
        }

        const { aws, bucketName } = getS3PermissionsResult.data;
        const profilePictureBody =
          await createProfilePictureJpeg(profilePictureFile);
        const profilePictureKey = `profile-pictures/${user.cognitoSub}.jpg`;
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
            Body: profilePictureBody,
            ContentType: PROFILE_PICTURE_CONTENT_TYPE,
          }),
        );
      }
    } finally {
      setModalLocked(false);
    }
  }, [
    getS3PermissionsResult,
    profilePictureFile,
    setModalLocked,
    user,
  ]);

  if (getUserPending || getS3PermissionsPending) {
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

  if (getUserError || getS3PermissionsError || !user) {
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
          onClick={() => setModal(null)}
          className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100"
        >
          <XIcon className="w-5 h-5 text-black" />
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
        </div>
      </div>
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
          onClick={updateUser}
          disabled={!hasChanges}
          initiallyDisabled
        />
      </div>
    </div>
  );
};

export default EditUserModal;
