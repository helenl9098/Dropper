# Dropper Game

Demo Link: https://helenl9098.github.io/Dropper/

## Implementation Details

- You can select one of the three maps on the upper right corner (Note: Map #3 has not been implemented yet).

- Map #1 (Rings) is created using repeated loop-shaped SDFs. The path the rings take is a simple sin curve (will offset by noise later on). The colors also change as a function of time, flashing between various bright colors.

- Map #2 (Cube) is created using a cylinder SDF that is masked using flooring functions to create a minecraft-like tunnel. The path the cylinder takes is also a simple sign curve (but will again be offset by noise later on). The colors of the tunnel are pink, with green rings that move through the tunnel as a function of time. The Tunnel has a glowing effect, which is calculated using the distance of the SDF to the eye. 

- The player is first-person and moves up/right/down/left using WASD respectively. This is done by actually shifting the SDFs, instead of the moving the camera. The player falls down continuously as the SDFs move continously in the Z direction over time.

- When the player intersects geometry, the screen turns blue -- will need to do something with this variable later!


## Things to Fix

- For both maps, I will make the path algorithm more complicated and offset by noise

- I need to find a way to communicate from the GPU to the CPU about when the player intersects the SDF

- For the rings map, I want to make the shapes change over time, making the map more interesting. I also want the rings to glow more.  

- For the cube map, there is this weird strip down the middle that I need to get rid of. I also want to make the tunnel shape more funky.

- I also plan on adding floating obstacles inside both maps


## Resources

- https://www.shadertoy.com/view/MscBRs
- https://www.shadertoy.com/view/XstfzB

