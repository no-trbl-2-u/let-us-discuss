export const KEYBOARD_INSTRUCTIONS_ID = 'boardroom-kbd-help'

export const KEYBOARD_INSTRUCTIONS_TEXT =
  'Drag-and-drop has a keyboard equivalent. Tab to a persona on the shelf, then press Space or Enter to pick it up. Use the arrow keys to choose a seat. Press Space or Enter again to drop. Press Escape at any time to cancel.'

/**
 * Visually-hidden screen-reader procedure for the dnd-kit
 * KeyboardSensor's pick-up / move / drop flow. Referenced by
 * the boardroom region's aria-describedby. Rendered once
 * per boardroom surface.
 */
export function KeyboardInstructions() {
  return (
    <p
      id={KEYBOARD_INSTRUCTIONS_ID}
      className="absolute w-px h-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)] -m-px"
    >
      {KEYBOARD_INSTRUCTIONS_TEXT}
    </p>
  )
}
