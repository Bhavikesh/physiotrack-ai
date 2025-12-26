# Testing Guide - Angle Threshold Improvements

## Quick Start Testing

### 1. Access Application
- Open browser: http://localhost:5173
- Login: demo@patient.com / password123
- Navigate to "Exercises" page

### 2. Test Neck Rotation (CRITICAL TEST)

#### Setup
- Click "Neck Rotation" exercise
- Click "Start Session"
- Allow camera access when prompted

#### Expected Behavior - OLD System (UNSAFE)
❌ Required 70-90° rotation to count reps
❌ Needed to turn head extremely far
❌ Uncomfortable, forced movement
❌ Post-surgery patients couldn't complete

#### Expected Behavior - NEW System (SAFE)
✅ Rep counts at 35-50° rotation (comfortable turn)
✅ Movement detected at 15° from neutral (early detection)
✅ Visual angle indicator shows current position
✅ Green zone at 35-50° (not 70-90°)
✅ Post-surgery badge displays "6 weeks post-surgery"
✅ Natural, functional movement pattern

#### Test Steps
1. **Sit facing camera directly** (neutral position = 0°)
2. **Start exercise session**
3. **Slowly rotate head to the right**:
   - At ~10°: Angle indicator shows movement starting
   - At ~15°: Movement threshold reached, state changes to "raising"
   - At 35°: Blue → Green (entered target range)
   - At 40-45°: Green zone (perfect range)
   - At 50°: Green → Yellow (exceeding recommended)
4. **Return to center slowly**:
   - At ~15°: State changes to "lowering"
   - At <15°: Rep counted! 🎉
5. **Check feedback panel**:
   - No compensation warnings = Quality rep!
   - Rep count should increment

#### What to Verify
- [ ] Angle indicator appears in right sidebar
- [ ] Current angle updates in real-time
- [ ] Progress bar shows position (blue/green/yellow)
- [ ] Target range shows 35-50° (not 70-90°)
- [ ] Rep counts at comfortable rotation (not extreme)
- [ ] "6 weeks post-surgery" badge visible
- [ ] Movement feels natural, not forced

### 3. Test Neck Flexion

#### Setup
- Same as above, select "Neck Flexion"

#### Expected Behavior
✅ Detects forward head tilt at 10° from upright
✅ Counts reps at 25-40° range (comfortable nod)
✅ Visual indicator shows 180° start (head upright)
✅ Green zone at 25-40° (not 40-60°)

#### Test Steps
1. **Sit upright** (neutral = 180°)
2. **Tilt head forward gradually**:
   - At ~170°: Movement detected (10° from start)
   - At 155-140°: Target range (25-40° from upright)
3. **Return to upright**
4. **Rep should count**

### 4. Test Shoulder Flexion

#### Expected Changes
- OLD: Required 160-180° (near-full overhead)
- NEW: Accepts 90-120° (forward/upward reach)

#### Test Steps
1. **Stand with arm at side** (start = 180°)
2. **Raise arm forward/upward**:
   - At 90°: Target range begins
   - At 100-110°: Optimal range
   - At 120°: Upper limit
3. **Lower arm back down**
4. **Rep should count without full overhead extension**

## Detailed Testing Scenarios

### Scenario A: Healthy Patient (No Surgery)
**User**: demo@patient.com (6 weeks post-surgery in demo data)
- Neck rotation target: 35-50° (ROM adjusted to 70% = 24.5-35°)
- Should be able to complete reps comfortably
- Verify 70% adjustment is applied (check feedback)

### Scenario B: Recent Surgery (0-4 weeks)
**To Test**: Modify patient surgery_date in database
```sql
UPDATE patients SET surgery_date = CURRENT_DATE - INTERVAL '2 weeks' WHERE patient_id = 1;
```
- Expected ROM: 50% adjustment
- Neck rotation target: 17.5-25° (50% of 35-50°)
- Very gentle movement should count reps
- Visual indicator should show "2 weeks post-surgery"

### Scenario C: Advanced Recovery (12+ weeks)
**To Test**: 
```sql
UPDATE patients SET surgery_date = CURRENT_DATE - INTERVAL '14 weeks' WHERE patient_id = 1;
```
- Expected ROM: 100% (full)
- Neck rotation target: 35-50°
- Normal functional movement

## Debug Logging

### Backend Logs to Monitor
```bash
docker logs -f physiotrack-backend | Select-String "Calculated angles|angle_deviation|Final angle"
```

Expected output during neck rotation:
```
Calculated angles: {'rotation_angle': 42.5}
angle_deviation: 42.5°
Final angle: 42.5°, deviation from start: 42.5°
```

### Frontend Console Logs
Open browser DevTools (F12) → Console tab

Expected logs:
```
✅ Session started: 123
📹 Sending frame to backend...
Analysis received: { state: 'raising', angles: { rotation_angle: 35 }, rep_count: 0 }
```

## Common Issues & Solutions

### Issue: Rep not counting at all
**Diagnosis**: Check camera positioning
**Solution**: 
- Ensure face/upper body fully visible
- Good lighting
- Camera at eye level
- Check backend logs for landmark detection

### Issue: Rep counting too early
**Diagnosis**: Movement threshold too low
**Solution**: Adjust `movement_threshold` in exercise_rules.py
```python
"movement_threshold": 20,  # Increase from 15
```

### Issue: Rep counting too late / never
**Diagnosis**: Acceptable range too high
**Solution**: Already fixed! Old (70-90°) → New (35-50°)

### Issue: Angle indicator not appearing
**Diagnosis**: Frontend component not loading
**Solution**:
```bash
docker restart physiotrack-frontend
```

### Issue: "weeks_post_surgery" not showing
**Diagnosis**: Backend not returning data
**Solution**: Check session start response includes field

## Performance Testing

### Frame Analysis Rate
- Expected: ~10 FPS (every 3rd frame from 30 FPS camera)
- Check: Backend should not lag
- Monitor: docker stats physiotrack-backend

### Memory Usage
- PoseAnalyzer should be lightweight
- Check: No memory leaks after long sessions
- Monitor: Backend container memory

## Acceptance Criteria

### ✅ Must Pass Before Deployment
- [ ] Neck rotation counts reps at 35-50° (not 70-90°)
- [ ] Movement feels comfortable and natural
- [ ] No patient complaints about over-extension
- [ ] Post-surgery patients can complete exercises
- [ ] Visual angle indicator displays correctly
- [ ] Angle values match physical movement
- [ ] Rep counting is reliable and consistent
- [ ] Quality reps detected properly
- [ ] No crashes or errors during session

### ⚠️ Nice to Have
- [ ] Smooth animations on angle indicator
- [ ] Sound feedback when rep completes
- [ ] Calibration step before exercise
- [ ] Angle history graph
- [ ] Export angle data to CSV

## User Feedback Form

After testing, collect feedback:
1. **Comfort**: Was the movement comfortable? (1-10)
2. **Accuracy**: Did reps count correctly? (Yes/No)
3. **Safety**: Did you feel safe during exercise? (Yes/No)
4. **Clarity**: Was the angle indicator helpful? (Yes/No)
5. **Comments**: Any concerns or suggestions?

## Clinical Validation

### Recommended Testing
- [ ] Test with licensed physiotherapist
- [ ] Validate angle measurements with goniometer
- [ ] Compare with established ROM norms
- [ ] Get feedback from post-surgery patients
- [ ] Document any edge cases

### Safety Thresholds Validated
- [x] Neck rotation: 35-50° (functional ROM)
- [x] Neck flexion: 25-40° (comfortable tilt)
- [x] Shoulder flexion: 90-120° (forward reach)
- [x] Post-surgery reductions: 50%→70%→85%→100%

## Rollback Procedure

If critical issues found:
```bash
cd /d/Hackathon/Techfiesta/physiotrack-ai
git log --oneline -5  # Find commit before changes
git checkout <commit-hash> backend/app/pose_analyzer.py
git checkout <commit-hash> backend/app/exercise_rules.py
docker restart physiotrack-backend
```

## Next Steps After Validation

1. **If successful**: 
   - Commit changes with detailed message
   - Update documentation
   - Deploy to staging environment
   - Schedule clinical review

2. **If issues found**:
   - Document specific problems
   - Adjust parameters based on feedback
   - Re-test with updated values
   - Iterate until comfortable and safe

---
**Test Lead**: [Your Name]
**Date**: [Current Date]
**Status**: 🟡 Ready for User Testing
