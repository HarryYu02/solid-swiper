import { animate } from "motion";
import {
  Accessor,
  batch,
  ComponentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  ParentProps,
  Setter,
  splitProps,
  useContext,
  VoidComponent,
  type Component,
} from "solid-js";
import { Card } from "../constants/cardItems";
import { cn } from "../libs/cn";
import { clamp } from "../libs/math";
import ArrowLeft from "./ArrowLeft";
import ArrowRight from "./ArrowRight";

const MIN_SWIPE_THRESHOLD = 3; // 3px
const SWIPE_SENSITIVITY = 1.3;
const CARD_GAP = 16; // 16px or 1rem
const CARD_WIDTH = 192; // 192px or 12rem

export type SwiperApi = {
  isLocked: Accessor<boolean>;
  toggleLocked: () => void;
  selected: Accessor<number>;
  swipePrev: () => void;
  swipeNext: () => void;
  swipeTo: Setter<number>;
  swipeBy: (n: number) => void;
  canSwipePrev: Accessor<boolean>;
  canSwipeNext: Accessor<boolean>;
};

type SwiperProps = {
  setApi?: (api: SwiperApi) => void;
  items: Accessor<Card[]>;
  opts?: {
    swipeThreshold?: number;
    swipeSensitivity?: number;
    itemWidth?: number;
    itemGap?: number;
  };
};

type SwiperContextProps = SwiperApi & SwiperProps;

const SwiperContext = createContext<Accessor<SwiperContextProps> | null>(null);

const useSwiper = () => {
  const context = useContext(SwiperContext);
  if (!context) {
    throw new Error("useSwiper must be used within a <Swiper />");
  }
  return context();
};

export const SwiperProvider: Component<ComponentProps<"div"> & SwiperProps> = (
  props,
) => {
  const merge = mergeProps<ParentProps<ComponentProps<"div"> & SwiperProps>[]>(
    {
      items: () => [],
      opts: {},
    },
    props,
  );
  const [local, rest] = splitProps(merge, [
    "setApi",
    "items",
    "opts",
    "class",
    "children",
  ]);
  const resolvedOpts = () => {
    return {
      itemWidth: CARD_WIDTH,
      itemGap: CARD_GAP,
      swipeThreshold: MIN_SWIPE_THRESHOLD,
      swipeSensitivity: SWIPE_SENSITIVITY,
      ...local.opts,
    };
  };

  const [selected, setSelected] = createSignal<number>(0);
  const [isLocked, setIsLocked] = createSignal<boolean>(false);
  const swipeBy = (n: number) => {
    setSelected((pos) => clamp(pos + n, 0, local.items().length - 1));
  };
  const canSwipePrev: Accessor<boolean> = () => selected() > 0;
  const canSwipeNext: Accessor<boolean> = () =>
    selected() < local.items().length - 1;
  const onPrevClicked = () => {
    if (canSwipePrev()) swipeBy(-1);
  };
  const onNextClicked = () => {
    if (canSwipeNext()) swipeBy(1);
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      swipeBy(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      swipeBy(1);
    }
  };
  const toggleLocked = () => setIsLocked((isLocked) => !isLocked);

  const api = {
    selected,
    isLocked,
    toggleLocked,
    canSwipeNext,
    canSwipePrev,
    swipeNext: onNextClicked,
    swipePrev: onPrevClicked,
    swipeTo: setSelected,
    swipeBy,
  };

  if (local.setApi) {
    local.setApi(api);
  }

  const value = createMemo(() => {
    return {
      items: local.items,
      opts: resolvedOpts(),
      ...api,
    } satisfies SwiperContextProps;
  });

  return (
    <SwiperContext.Provider value={value}>
      <div
        class={cn("relative", local.class)}
        role="region"
        aria-roledescription="swiper"
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {local.children}
      </div>
    </SwiperContext.Provider>
  );
};

export const SwiperPrevious: VoidComponent<ComponentProps<"button">> = (
  props,
) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { canSwipePrev, swipePrev, isLocked } = useSwiper();
  return (
    <button
      class={cn(
        "absolute z-10 rounded-full bg-white p-2 text-xl transition-all disabled:brightness-50",
        "cursor-pointer touch-manipulation",
        local.class,
        !canSwipePrev() && "cursor-not-allowed",
        isLocked() && "hidden",
      )}
      disabled={!canSwipePrev() || isLocked()}
      onClick={swipePrev}
      {...rest}
    >
      <ArrowLeft />
    </button>
  );
};

export const SwiperNext: VoidComponent<ComponentProps<"button">> = (props) => {
  const [local, rest] = splitProps(props, ["class"]);
  const { canSwipeNext, swipeNext, isLocked } = useSwiper();
  return (
    <button
      class={cn(
        "absolute z-10 rounded-full bg-white p-2 text-xl transition-all disabled:brightness-50",
        "cursor-pointer touch-manipulation",
        local.class,
        !canSwipeNext() && "cursor-not-allowed",
        isLocked() && "hidden",
      )}
      disabled={!canSwipeNext() || isLocked()}
      onClick={swipeNext}
      {...rest}
    >
      <ArrowRight />
    </button>
  );
};

export const SwiperCounter: VoidComponent<ComponentProps<"div">> = (props) => {
  const { selected, items, isLocked } = useSwiper();

  return (
    <div
      class={cn(
        "flex items-center justify-center",
        props.class,
        isLocked() && "hidden",
      )}
    >
      <p>
        {selected() + 1}/{items().length}
      </p>
    </div>
  );
};

export const SwiperContent: Component<ComponentProps<"div">> = (props) => {
  let cardsDiv: HTMLDivElement | undefined;
  const { opts, selected, isLocked, swipeBy } = useSwiper();

  const [prevX, setPrevX] = createSignal(0);
  const [delta, setDelta] = createSignal<number>(0);
  const [isDragging, setIsDragging] = createSignal(false);

  const cardFullWidth = () => opts.itemWidth + opts.itemGap;

  const resetDragSignals = () =>
    batch(() => {
      setPrevX(0);
      setDelta(0);
      setIsDragging(false);
    });

  const onDragDone = () => {
    if (isDragging() && delta() != 0 && prevX() != 0) {
      const distance = Math.abs(delta());
      if (distance > cardFullWidth() * 1.5) {
        swipeBy(
          -1 * Math.floor((delta() + cardFullWidth() / 2) / cardFullWidth()),
        );
      } else if (distance > cardFullWidth() / 2) {
        swipeBy(delta() < 0 ? 1 : -1);
      }
    }
    resetDragSignals();
  };

  const dx = createMemo(() => delta() - selected() * cardFullWidth());

  createEffect(() => {
    animate(
      cardsDiv,
      { x: `${dx()}px` },
      { duration: 0.7, ease: "easeInOut", type: "spring", bounce: 0.25 },
    );
  });

  return (
    <div class="overflow-hidden">
      <div
        class={cn("flex", props.class)}
        onPointerDown={(e) => {
          if (!isLocked()) {
            batch(() => {
              setPrevX(e.clientX);
              setDelta(0);
              setIsDragging(true);
            });
          }
        }}
        onPointerMove={(e) => {
          if (!isDragging()) return;
          const diff = e.clientX - prevX();
          if (Math.abs(diff) > opts.swipeThreshold) {
            setDelta((d) => d + diff * opts.swipeSensitivity);
            setPrevX(e.clientX);
          }
        }}
        onPointerLeave={onDragDone}
        onPointerCancel={onDragDone}
        onPointerUp={onDragDone}
      >
        <div
          ref={cardsDiv}
          class="flex items-center"
          style={{
            gap: `${opts.itemGap}px`,
          }}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
};
