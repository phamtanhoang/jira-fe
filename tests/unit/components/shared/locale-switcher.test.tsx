/**
 * Component test — <LocaleSwitcher />.
 *
 * This is a HARDER example because:
 *   1) The component uses a zustand store (useAppStore) → must be MOCKED
 *   2) It uses @base-ui DropdownMenu → requires userEvent to open + click
 *
 * Flow:
 *   - render(<LocaleSwitcher />)
 *   - screen.getByXxx(...) → query the DOM
 *   - userEvent.click(...) → simulate user interaction
 *   - expect(mockSetLocale).toHaveBeenCalledWith("en") → assert handler fired
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

// Mock function — tracks calls and arguments
const mockSetLocale = jest.fn();
let mockLocale: "vi" | "en" = "vi";

// Replace the useAppStore module with a fake implementation.
// Each call inside the component gets { locale, setLocale } from here.
jest.mock("@/lib/stores/use-app-store", () => ({
  useAppStore: () => ({
    locale: mockLocale,
    setLocale: mockSetLocale,
  }),
}));

describe("<LocaleSwitcher />", () => {
  beforeEach(() => {
    // Reset mock state before each test so tests stay independent
    mockSetLocale.mockClear();
    mockLocale = "vi";
  });

  it("renders the current locale label (VI)", () => {
    render(<LocaleSwitcher />);
    expect(screen.getByText(/VI/)).toBeInTheDocument();
  });

  it("renders EN label when locale is 'en'", () => {
    mockLocale = "en";
    render(<LocaleSwitcher />);
    expect(screen.getByText(/EN/)).toBeInTheDocument();
  });

  it("opens dropdown and calls setLocale('en') when English is clicked", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);

    // Click trigger button to open dropdown
    await user.click(screen.getByRole("button"));

    // Dropdown is open → find the "English" item and click
    const englishItem = await screen.findByText("English");
    await user.click(englishItem);

    // Assert handler was called with the correct argument
    expect(mockSetLocale).toHaveBeenCalledTimes(1);
    expect(mockSetLocale).toHaveBeenCalledWith("en");
  });

  it("shows both language options when dropdown is open", async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText("English")).toBeInTheDocument();
    expect(screen.getByText(/Ti.*ng Vi.*t/)).toBeInTheDocument(); // "Tiếng Việt"
  });
});
