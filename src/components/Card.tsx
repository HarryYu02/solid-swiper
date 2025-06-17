import { JSXElement, ParentComponent } from "solid-js";
import { cn } from "../libs/cn";

const Card: ParentComponent<{ back: JSXElement }> = (props) => {
  return (
    <div
      class={cn(
        "card aspect-square h-48 w-48 rounded-lg bg-slate-700 shadow-xl",
        "flex cursor-pointer snap-center items-center justify-center",
        "relative perspective-distant transform-3d",
      )}
    >
      <div class="absolute backface-hidden">{props.children}</div>
      <div class="absolute rotate-y-180 backface-hidden">{props.back}</div>
    </div>
  );
};

export default Card;
