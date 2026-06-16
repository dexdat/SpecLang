use std::time::{Duration, Instant};
use tokio::time;

pub struct ConvergenceDetector {
    last_event: Instant,
    quiet_period: Duration,
}

impl ConvergenceDetector {
    pub fn new(quiet_period: Duration) -> Self {
        ConvergenceDetector {
            last_event: Instant::now(),
            quiet_period,
        }
    }

    pub fn on_event(&mut self) {
        self.last_event = Instant::now();
    }

    pub fn is_converged(&self) -> bool {
        self.last_event.elapsed() >= self.quiet_period
    }

    pub fn time_remaining(&self) -> Option<Duration> {
        let elapsed = self.last_event.elapsed();
        if elapsed < self.quiet_period {
            Some(self.quiet_period - elapsed)
        } else {
            None
        }
    }

    pub async fn run(&self) {
        loop {
            if self.is_converged() {
                tracing::info!("Convergence detected after {:?} quiet period", self.quiet_period);
                // TODO: Trigger pipeline execution
                break;
            }
            time::sleep(Duration::from_secs(1)).await;
        }
    }
}
