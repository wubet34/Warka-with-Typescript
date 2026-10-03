interface SkeletonProps {
  className?: string;
}

export const SkeletonBlock = ({ className = "" }: SkeletonProps) => (
  <div aria-hidden="true" className={`animate-pulse rounded-lg bg-[var(--surface2)] ${className}`} />
);

interface CountProps {
  count?: number;
}

export const PostListSkeleton = ({ count = 3 }: CountProps) => (
  <div aria-label="Loading posts" className="space-y-4" role="status">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex">
          <div className="flex w-12 shrink-0 flex-col items-center gap-3 py-5" style={{ backgroundColor: "var(--surface2)" }}>
            <SkeletonBlock className="h-4 w-5" />
            <SkeletonBlock className="h-3 w-5" />
            <SkeletonBlock className="h-4 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-3 p-4">
            <SkeletonBlock className="h-3 w-2/5" />
            <SkeletonBlock className="h-5 w-4/5" />
            <SkeletonBlock className="h-3 w-full" />
            {index !== 1 && <SkeletonBlock className="mt-4 h-36 w-full rounded-xl" />}
            <div className="flex gap-3 pt-1">
              <SkeletonBlock className="h-7 w-20 rounded-full" />
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const CommunityPageSkeleton = () => (
  <div aria-label="Loading community" className="space-y-4" role="status">
    <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <SkeletonBlock className="h-28 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-5 w-2/5" />
        <SkeletonBlock className="h-3 w-4/5" />
        <SkeletonBlock className="h-3 w-1/3" />
      </div>
    </div>
    <PostListSkeleton count={2} />
  </div>
);

export const ProfilePageSkeleton = () => (
  <div aria-label="Loading profile" className="mx-auto max-w-4xl space-y-4" role="status">
    <section className="overflow-hidden rounded-xl" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <SkeletonBlock className="h-32 w-full rounded-none sm:h-40" />
      <div className="space-y-3 p-5">
        <SkeletonBlock className="-mt-10 h-20 w-20 rounded-full border-4" />
        <SkeletonBlock className="h-5 w-1/3" />
        <SkeletonBlock className="h-3 w-2/3" />
        <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonBlock key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
    </section>
    <PostListSkeleton count={2} />
  </div>
);

export const DetailPageSkeleton = () => (
  <div aria-label="Loading post" className="space-y-4" role="status">
    <SkeletonBlock className="h-4 w-1/3" />
    <PostListSkeleton count={1} />
    <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <SkeletonBlock className="h-5 w-1/4" />
      {Array.from({ length: 3 }, (_, i) => <SkeletonBlock key={i} className={`h-12 rounded-xl ${i ? "ml-6" : ""}`} />)}
    </div>
  </div>
);

export const RowSkeleton = ({ count = 3 }: CountProps) => (
  <div aria-label="Loading" className="space-y-3 p-3" role="status">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-3/5" />
          <SkeletonBlock className="h-3 w-4/5" />
        </div>
      </div>
    ))}
  </div>
);
