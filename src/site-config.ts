export const SiteConfig = {
  title: "Jobio",
  description:
    "Le cockpit commercial des freelances tech. Trouve des missions, relance au bon moment, signe plus.",
  prodUrl: "https://jobio.app",
  appId: "jobio",
  domain: "jobio.app",
  appIcon: "/images/icon.png",
  company: {
    name: "Jobio",
    address: "",
  },
  brand: {
    primary: "#22D3EE",
  },
  team: {
    image: "",
    website: "https://jobio.app",
    twitter: "",
    name: "Jobio",
  },
  features: {
    /**
     * If enable, you need to specify the logic of upload here : src/features/images/uploadImageAction.tsx
     * You can use Vercel Blob Storage : https://vercel.com/docs/storage/vercel-blob
     * Or you can use Cloudflare R2 : https://mlv.sh/cloudflare-r2-tutorial
     * Or you can use AWS S3 : https://mlv.sh/aws-s3-tutorial
     */
    enableImageUpload: false as boolean,
    /**
     * If enable, the user will be redirected to `/app` when he visits the landing page at `/`
     * The logic is located in middleware.ts
     */
    enableLandingRedirection: true as boolean,
  },
};
