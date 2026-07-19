import { render, screen } from "@testing-library/react"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("does not render a nested button when given a button child", () => {
    render(
      <Button>
        <button type="button">Child action</button>
      </Button>
    )

    const button = screen.getByRole("button", { name: /child action/i })
    expect(button).toBeInTheDocument()
    expect(document.querySelectorAll("button")).toHaveLength(1)
  })

  it("supports render-based trigger composition without nesting a button", () => {
    render(
      <Button render={<button type="button">Trigger</button>}>
        Label
      </Button>
    )

    expect(screen.getByRole("button", { name: /label/i })).toBeInTheDocument()
    expect(document.querySelectorAll("button")).toHaveLength(1)
  })
})
