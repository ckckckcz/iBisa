import Image from "next/image";

export function CloudDivider() {
  return (
    <div
      className="relative w-full mt-auto pointer-events-none z-10 leading-none overflow-hidden -mb-px"
      aria-hidden="true"
    >
      <Image
        src="/cloud.png"
        alt=""
        width={748}
        height={117}
        className="w-full h-16.25 sm:h-23.75 md:h-32.5 lg:h-40 object-fill object-bottom select-none block"
        priority
      />
    </div>
  );
}
