import {
  animate,
  AnimationOptions,
  DOMKeyframesDefinition,
  press,
} from "motion";
import {
  Accessor,
  batch,
  ComponentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  mergeProps,
  onCleanup,
  ParentComponent,
  ParentProps,
  Setter,
  splitProps,
  useContext,
  VoidComponent,
  type Component,
} from "solid-js";
import { Card, initialCards } from "../constants/cardItems";
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
    swipeThreshold: number;
    swipeSensitivity: number;
    cardWidth: number;
    cardGap: number;
  };
  prepend?: () => void;
  append?: () => void;
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
      opts: {
        cardWidth: CARD_WIDTH,
        cardGap: CARD_GAP,
        swipeThreshold: MIN_SWIPE_THRESHOLD,
        swipeSensitivity: SWIPE_SENSITIVITY,
      },
      prepend: () => {},
      append: () => {},
    },
    props,
  );
  const [local, rest] = splitProps(merge, [
    "setApi",
    "items",
    "opts",
    "prepend",
    "append",
    "class",
    "children",
  ]);

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
      opts: local.opts,
      prepend: local.prepend,
      append: local.append,
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

export const SwiperItem: ParentComponent<
  ComponentProps<"div"> & {
    back: JSXElement;
    canBeTapped: Accessor<boolean>;
    toggleLocked: () => void;
  }
> = (props) => {
  let cardRef: HTMLDivElement | undefined;
  const [tapped, setTapped] = createSignal<number>(0);
  const { opts, selected } = useSwiper();

  createEffect(() => {
    const cancelPress = press(cardRef, (element) => {
      const pressPos = selected();
      // On press end
      return () => {
        let anim: DOMKeyframesDefinition;
        let opt: AnimationOptions;

        if (!props.canBeTapped() || selected() != pressPos) return;

        switch (tapped()) {
          case 0:
            anim = { scale: 1.5, rotateY: 0, zIndex: 20 };
            opt = { type: "spring", stiffness: 500 };
            break;
          case 1:
            anim = { rotateY: 180 };
            opt = { type: "spring", duration: 1, stiffness: 100 };
            break;
          case 2:
            anim = { scale: 1, rotateY: 0, zIndex: 0 };
            opt = { type: "spring", stiffness: 200 };
            break;
          default:
            break;
        }

        animate(element, anim, opt);
        setTapped((prev) => {
          if (prev == 0 || prev == 2) props.toggleLocked();
          const next = prev === 2 ? 0 : prev + 1;
          return next;
        });
      };
    });

    onCleanup(() => {
      cancelPress();
    });
  });

  return (
    <div
      ref={cardRef}
      class={cn(
        "aspect-square rounded-lg bg-slate-700 shadow-xl",
        "flex cursor-pointer snap-center items-center justify-center",
        "relative perspective-distant transform-3d",
      )}
      style={{
        width: `${opts.cardWidth}px`,
      }}
    >
      <div class="absolute backface-hidden">{props.children}</div>
      <div class="absolute rotate-y-180 backface-hidden">{props.back}</div>
    </div>
  );
};

export const SwiperContent: Component<ComponentProps<"div">> = (props) => {
  let cardsDiv: HTMLDivElement | undefined;
  const { opts, selected, isLocked, toggleLocked, swipeBy, items } =
    useSwiper();

  const [prevX, setPrevX] = createSignal(0);
  const [delta, setDelta] = createSignal<number>(0);
  const [isDragging, setIsDragging] = createSignal(false);

  const cardFullWidth = () => opts.cardWidth + opts.cardGap;

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

  createEffect(() => {
    animate(
      cardsDiv,
      { x: `calc(-${selected() * cardFullWidth()}px + ${delta()}px)` },
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
            gap: `${opts.cardGap}px`,
          }}
        >
          <For each={items()}>
            {(card, i) => {
              const isFocused = () => i() == selected();
              return (
                <SwiperItem
                  back={
                    <p class="pointer-events-none text-center text-3xl font-semibold text-white select-none">
                      Back of {card.name}
                    </p>
                  }
                  canBeTapped={() => isFocused() && !isDragging()}
                  toggleLocked={toggleLocked}
                >
                  <p class="pointer-events-none text-3xl font-semibold text-white select-none">
                    {card.name}
                  </p>
                </SwiperItem>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
};
